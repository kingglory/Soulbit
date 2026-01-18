package main

// 导入所需库
import (
	"bytes"        // 提供字节序列处理功能，用于构建请求体
	"encoding/json" // 提供JSON编解码功能，用于处理HTTP请求和响应
	"fmt"           // 提供格式化功能，用于生成游戏ID
	"log"           // 提供日志记录功能，用于输出服务器运行信息
	"math/rand"     // 提供随机数生成功能，用于游戏逻辑
	"net/http"      // 提供HTTP客户端和服务器实现，用于构建API网关
	"net/url"
	"os"            // 提供操作系统功能接口，用于读取环境变量
	"time"          // 提供时间功能，用于生成游戏ID和随机数种子

	"github.com/gorilla/websocket"
)

// 数据结构定义

// helloResp 健康检查响应结构
type helloResp struct {
	Message string `json:"message"` // 响应消息
}

// llmIn LLM请求输入结构
type llmIn struct {
	Prompt string `json:"prompt"` // 用户输入的提示词
}

// llmOut LLM响应输出结构
type llmOut struct {
	Reply string `json:"reply"` // 模型回复内容
	Error string `json:"error,omitempty"` // 错误信息（可选）
}

// 游戏相关数据结构

// fiveElementsGameReq 五行匹配游戏请求结构
type fiveElementsGameReq struct {
	Difficulty string `json:"difficulty,omitempty"` // 游戏难度（easy/medium/hard）
	RoundCount int    `json:"roundCount,omitempty"` // 游戏回合数
}

// fiveElementsGameResp 五行匹配游戏响应结构
type fiveElementsGameResp struct {
	GameID     string   `json:"gameId"`     // 游戏ID
	Round      int      `json:"round"`      // 当前回合
	Element    string   `json:"element"`    // 五行元素
	Question   string   `json:"question"`   // 问题类型（generate/conquer）
	Options    []string `json:"options"`    // 选项列表
	CorrectAns string   `json:"correctAns"` // 正确答案（仅用于调试）
}

// fiveElementsGuessReq 五行匹配游戏猜测请求结构
type fiveElementsGuessReq struct {
	GameID string `json:"gameId"` // 游戏ID
	Guess  string `json:"guess"`  // 用户猜测
}

// fiveElementsGuessResp 五行匹配游戏猜测响应结构
type fiveElementsGuessResp struct {
	Correct    bool   `json:"correct"`    // 猜测是否正确
	Score      int    `json:"score"`      // 当前得分
	NextRound  *fiveElementsGameResp `json:"nextRound,omitempty"` // 下一轮游戏数据
	GameOver   bool   `json:"gameOver"`   // 游戏是否结束
	FinalScore int    `json:"finalScore,omitempty"` // 最终得分
}

// fortuneTellingReq AI算命请求结构
type fortuneTellingReq struct {
	Name      string `json:"name"`      // 用户姓名
	Gender    string `json:"gender"`    // 用户性别
	BirthDate string `json:"birthDate"` // 出生日期（YYYY-MM-DD）
	BirthTime string `json:"birthTime"` // 出生时间（HH:MM）
	Question  string `json:"question,omitempty"` // 具体问题
}

// fortuneTellingResp AI算命响应结构
type fortuneTellingResp struct {
	Analysis string `json:"analysis"` // 命理解读
	Advice   string `json:"advice"`   // 建议
	Error    string `json:"error,omitempty"` // 错误信息
}

// WebSocket升级器
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// 允许所有来源的WebSocket连接
		return true
	},
}

// cors CORS中间件，处理跨域请求
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 设置CORS头信息
		w.Header().Set("Access-Control-Allow-Origin", "*") // 允许所有来源
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type") // 允许Content-Type头
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, WS, WSS") // 允许的HTTP方法
		
		// 处理OPTIONS预检请求
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		
		// 传递请求到下一个处理器
		next.ServeHTTP(w, r)
	})
}

// wsHandler WebSocket代理处理函数，转发WebSocket连接到Python服务
// 功能：将客户端的WebSocket连接转发到Python后端服务，实现双向实时通信
func wsHandler(w http.ResponseWriter, r *http.Request) {
	// 1. 将HTTP请求升级为WebSocket连接
	// upgrader对象定义了WebSocket连接的配置（如允许的来源）
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("无法升级为WebSocket连接: %v", err)
		return
	}
	// 延迟关闭客户端WebSocket连接（函数结束时执行）
	defer c.Close()

	// 2. 获取Python后端服务的URL配置
	// 优先从环境变量PY_SERVICE_URL获取，如果没有则使用默认值
	pyUrl := os.Getenv("PY_SERVICE_URL")
	if pyUrl == "" {
		pyUrl = "http://localhost:8000" // 默认Python服务地址
	}

	// 3. 解析Python服务URL并转换为WebSocket协议
	wsUrl, err := url.Parse(pyUrl)
	if err != nil {
		log.Printf("解析Python服务URL失败: %v", err)
		return
	}

	// 将HTTP协议转换为WebSocket协议
	if wsUrl.Scheme == "http" {
		wsUrl.Scheme = "ws"   // HTTP -> WebSocket
	} else if wsUrl.Scheme == "https" {
		wsUrl.Scheme = "wss"  // HTTPS -> WebSocket Secure
	}

	// 设置WebSocket连接路径
	wsUrl.Path = "/ws/chat"

	// 4. 建立与Python服务的WebSocket连接
	pyConn, _, err := websocket.DefaultDialer.Dial(wsUrl.String(), nil)
	if err != nil {
		log.Printf("连接Python WebSocket服务失败: %v", err)
		return
	}
	// 延迟关闭与Python服务的WebSocket连接
	defer pyConn.Close()

	log.Printf("WebSocket代理已连接到: %s", wsUrl.String())

	// 5. 创建消息转发通道
	// clientChan: 客户端发送到Python服务的消息通道
	// pythonChan: Python服务发送到客户端的消息通道
	clientChan := make(chan []byte)
	pythonChan := make(chan []byte)

	// 6. 创建goroutine（并发线程）：从客户端读取消息并转发到Python服务
	go func() {
		defer close(clientChan) // 函数结束时关闭通道
		for {
			// 从客户端WebSocket连接读取消息
			_, message, err := c.ReadMessage()
			if err != nil {
				// 检查是否为意外关闭错误
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("从客户端读取消息错误: %v", err)
				}
				return // 退出goroutine
			}
			// 将读取到的消息发送到clientChan通道
			clientChan <- message
		}
	}()

	// 7. 创建goroutine：从Python服务读取消息并转发到客户端
	go func() {
		defer close(pythonChan) // 函数结束时关闭通道
		for {
			// 从Python服务WebSocket连接读取消息
			_, message, err := pyConn.ReadMessage()
			if err != nil {
				// 检查是否为意外关闭错误
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("从Python服务读取消息错误: %v", err)
				}
				return // 退出goroutine
			}
			// 将读取到的消息发送到pythonChan通道
			pythonChan <- message
		}
	}()

	// 8. 主循环：处理消息转发
	for {
		// 使用select语句监听两个通道的消息
		select {
		// 处理客户端到Python服务的消息
		case message, ok := <-clientChan:
			if !ok {
				// clientChan通道已关闭，发送关闭消息给Python服务并退出
				pyConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
				return
			}
			// 将客户端消息发送到Python服务
			if err := pyConn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("发送消息到Python服务错误: %v", err)
				return
			}
		// 处理Python服务到客户端的消息
		case message, ok := <-pythonChan:
			if !ok {
				// pythonChan通道已关闭，发送关闭消息给客户端并退出
				c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
				return
			}
			// 将Python服务消息发送到客户端
			if err := c.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("发送消息到客户端错误: %v", err)
				return
			}
		}
	}
}

// helloHandler 健康检查接口处理函数
func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json") // 设置响应内容类型为JSON
	_ = json.NewEncoder(w).Encode(helloResp{Message: "Hello from Go"}) // 返回健康检查响应
}

// llmHandler LLM接口处理函数，转发请求到Python服务
func llmHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json") // 设置响应内容类型为JSON
    
    // 解析请求体：将HTTP请求中的JSON数据转换为Go结构体
    // 1. 声明一个llmIn类型的变量，用于存储解析后的数据
    var in llmIn
    // 2. 使用json.NewDecoder创建一个JSON解码器，从请求体(r.Body)中读取数据
    // 3. 调用Decode方法将JSON数据解码到in变量中，&in表示传递变量的地址
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        // 4. 如果解码失败（例如JSON格式错误），执行错误处理逻辑
        // 5. 设置HTTP响应状态码为400 Bad Request，表示客户端请求格式错误
        w.WriteHeader(http.StatusBadRequest)
        // 6. 创建一个包含错误信息的llmOut结构体
        // 7. 使用json.NewEncoder将错误响应编码为JSON格式并写入响应体
        _ = json.NewEncoder(w).Encode(llmOut{Error: "invalid json"})
        // 8. 返回函数，终止后续处理
        return
    }
    
    // 序列化请求数据：将Go结构体转换为JSON格式的字节数组
    // 简单来说，就是把代码中方便操作的数据结构，变成能在网络上传输的JSON字符串
    // 示例：
    // 如果 in 结构体的值是 {Prompt: "你好，世界"}
    // 序列化后得到的JSON字节数组是 {"prompt":"你好，世界"}
    b, _ := json.Marshal(in)
    
    // 获取Python服务URL（从环境变量或默认值）
    url := os.Getenv("PY_SERVICE_URL")
    if url == "" {
        url = "http://localhost:8000" // 默认URL
    }
    
    // 转发请求到Python服务
    resp, err := http.Post(url+"/llm", "application/json", bytes.NewBuffer(b))
    if err != nil {
        w.WriteHeader(http.StatusBadGateway) // 502错误：Python服务不可用
        _ = json.NewEncoder(w).Encode(llmOut{Error: "python service unavailable"}) // 返回错误信息
        return
    }
    defer resp.Body.Close() // 确保响应体被关闭
    
    // 解析Python服务的响应
    var out llmOut
    if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
        w.WriteHeader(http.StatusBadGateway) // 502错误：Python服务响应格式错误
        _ = json.NewEncoder(w).Encode(llmOut{Error: "invalid response from python"}) // 返回错误信息
        return
    }
    
    // 返回响应给客户端
    _ = json.NewEncoder(w).Encode(out)
}

// 游戏相关处理函数

// 五行数据
var fiveElements = map[string]map[string]string{
    "金": {"generates": "水", "conquers": "木"},
    "木": {"generates": "火", "conquers": "土"},
    "水": {"generates": "木", "conquers": "火"},
    "火": {"generates": "土", "conquers": "金"},
    "土": {"generates": "金", "conquers": "水"},
}

// 游戏状态存储
var gameStates = make(map[string]map[string]interface{})

// newFiveElementsGame 生成新的五行匹配游戏数据
func newFiveElementsGame(gameID string, round int) fiveElementsGameResp {
    // 获取所有五行元素
    elements := []string{"金", "木", "水", "火", "土"}
    // 随机选择一个元素
    element := elements[rand.Intn(len(elements))]
    // 随机选择问题类型（generate/conquer）
    questionTypes := []string{"generate", "conquer"}
    questionType := questionTypes[rand.Intn(len(questionTypes))]
    
    // 获取正确答案
    correctAns := fiveElements[element][questionType]
    
    // 生成选项（包含正确答案和三个错误答案）
    options := []string{correctAns}
    for len(options) < 4 {
        randomElement := elements[rand.Intn(len(elements))]
        if randomElement != correctAns && !contains(options, randomElement) {
            options = append(options, randomElement)
        }
    }
    
    // 打乱选项顺序
    for i := range options {
        j := rand.Intn(i + 1)
        options[i], options[j] = options[j], options[i]
    }
    
    return fiveElementsGameResp{
        GameID:     gameID,
        Round:      round,
        Element:    element,
        Question:   questionType,
        Options:    options,
        CorrectAns: correctAns,
    }
}

// contains 检查切片中是否包含指定元素
func contains(slice []string, item string) bool {
    for _, s := range slice {
        if s == item {
            return true
        }
    }
    return false
}

// startFiveElementsGame 启动五行匹配游戏
func startFiveElementsGame(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    
    // 解析请求参数
    var req fiveElementsGameReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        w.WriteHeader(http.StatusBadRequest)
        _ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid json"})
        return
    }
    
    // 设置默认值
    if req.RoundCount == 0 {
        req.RoundCount = 10
    }
    
    // 生成游戏ID
    gameID := fmt.Sprintf("%d", time.Now().UnixNano())
    
    // 创建游戏状态
    gameStates[gameID] = map[string]interface{}{
        "round":      1,
        "maxRounds":  req.RoundCount,
        "score":      0,
        "difficulty": req.Difficulty,
    }
    
    // 生成第一回合游戏数据
    firstRound := newFiveElementsGame(gameID, 1)
    
    // 返回响应
    _ = json.NewEncoder(w).Encode(firstRound)
}

// guessFiveElements 处理五行匹配游戏猜测
func guessFiveElements(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    
    // 解析请求参数
    var req fiveElementsGuessReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        w.WriteHeader(http.StatusBadRequest)
        _ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid json"})
        return
    }
    
    // 获取游戏状态
    gameState, exists := gameStates[req.GameID]
    if !exists {
        w.WriteHeader(http.StatusBadRequest)
        _ = json.NewEncoder(w).Encode(map[string]string{"error": "game not found"})
        return
    }
    
    // 获取当前回合数据
    round := gameState["round"].(int)
    maxRounds := gameState["maxRounds"].(int)
    score := gameState["score"].(int)
    
    // 简化处理：假设最后一次生成的游戏数据是当前回合（实际项目中需要存储更多信息）
    // 这里我们重新生成当前回合的正确答案来验证猜测
    // 注意：这只是演示代码，实际项目中应该存储每个回合的正确答案
    elements := []string{"金", "木", "水", "火", "土"}
    questionTypes := []string{"generate", "conquer"}
    
    // 这里应该从存储的游戏数据中获取元素和问题类型
    // 为了简化，我们随机生成一个元素和问题类型
    element := elements[rand.Intn(len(elements))]
    questionType := questionTypes[rand.Intn(len(questionTypes))]
    correctAns := fiveElements[element][questionType]
    
    // 检查猜测是否正确
    correct := req.Guess == correctAns
    
    // 更新得分
    if correct {
        score += 10
        gameState["score"] = score
    }
    
    // 准备响应
    resp := fiveElementsGuessResp{
        Correct: correct,
        Score:   score,
        GameOver: round >= maxRounds,
    }
    
    // 如果游戏未结束，生成下一轮数据
    if round < maxRounds {
        nextRound := newFiveElementsGame(req.GameID, round+1)
        resp.NextRound = &nextRound
        gameState["round"] = round + 1
    } else {
        // 游戏结束，清理游戏状态
        delete(gameStates, req.GameID)
        resp.FinalScore = score
    }
    
    // 返回响应
    _ = json.NewEncoder(w).Encode(resp)
}

// fortuneTellingHandler AI算命处理函数
func fortuneTellingHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    
    // 解析请求参数
    var req fortuneTellingReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        w.WriteHeader(http.StatusBadRequest)
        _ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid json"})
        return
    }
    
    // 检查必填参数
    if req.Name == "" || req.Gender == "" || req.BirthDate == "" || req.BirthTime == "" {
        w.WriteHeader(http.StatusBadRequest)
        _ = json.NewEncoder(w).Encode(map[string]string{"error": "missing required parameters"})
        return
    }
    
    // 构造请求到Python服务
    b, _ := json.Marshal(req)
    
    // 获取Python服务URL
    url := os.Getenv("PY_SERVICE_URL")
    if url == "" {
        url = "http://localhost:8000" // 默认URL
    }
    
    // 转发请求到Python服务
    resp, err := http.Post(url+"/fortune-telling", "application/json", bytes.NewBuffer(b))
    if err != nil {
        // 如果Python服务不可用，返回一个简单的模拟响应
        mockResp := fortuneTellingResp{
            Analysis: fmt.Sprintf("根据您的出生信息（%s %s），您是一个%s的人。", req.BirthDate, req.BirthTime, req.Gender),
            Advice:   "保持积极的心态，努力工作，您的未来会很美好。",
        }
        _ = json.NewEncoder(w).Encode(mockResp)
        return
    }
    defer resp.Body.Close()
    
    // 解析Python服务的响应
    var out fortuneTellingResp
    if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
        // 如果解析失败，返回模拟响应
        mockResp := fortuneTellingResp{
            Analysis: fmt.Sprintf("根据您的出生信息（%s %s），您是一个%s的人。", req.BirthDate, req.BirthTime, req.Gender),
            Advice:   "保持积极的心态，努力工作，您的未来会很美好。",
        }
        _ = json.NewEncoder(w).Encode(mockResp)
        return
    }
    
    // 返回响应给客户端
    _ = json.NewEncoder(w).Encode(out)
}

// main 程序入口函数
func main() {
	// 初始化随机数种子
	rand.Seed(time.Now().UnixNano())
	
	// 创建HTTP路由多路复用器
	mux := http.NewServeMux()
	
	// 注册路由处理函数
	mux.HandleFunc("/api/hello", helloHandler) // 健康检查路由
	mux.HandleFunc("/api/llm", llmHandler) // LLM接口路由
	mux.HandleFunc("/api/ws/chat", wsHandler) // WebSocket聊天接口路由
	// 游戏API路由
	mux.HandleFunc("/api/game/five-elements/start", startFiveElementsGame) // 启动五行匹配游戏
	mux.HandleFunc("/api/game/five-elements/guess", guessFiveElements) // 五行匹配游戏猜测
	mux.HandleFunc("/api/game/fortune-telling", fortuneTellingHandler) // AI算命
	
	// 启动HTTP服务器，监听8080端口，使用CORS中间件
	log.Println("Gateway on :8080") // 记录日志
	_ = http.ListenAndServe(":8080", cors(mux)) // 启动服务器
}

