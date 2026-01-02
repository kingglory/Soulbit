package main

// 导入所需库
import (
	"bytes"        // 提供字节序列处理功能，用于构建请求体
	"encoding/json" // 提供JSON编解码功能，用于处理HTTP请求和响应
	"log"           // 提供日志记录功能，用于输出服务器运行信息
	"net/http"      // 提供HTTP客户端和服务器实现，用于构建API网关
	"net/url"
	"os"            // 提供操作系统功能接口，用于读取环境变量

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

// main 程序入口函数
func main() {
	// 创建HTTP路由多路复用器
	mux := http.NewServeMux()
	
	// 注册路由处理函数
	mux.HandleFunc("/api/hello", helloHandler) // 健康检查路由
	mux.HandleFunc("/api/llm", llmHandler) // LLM接口路由
	mux.HandleFunc("/api/ws/chat", wsHandler) // WebSocket聊天接口路由
	
	// 启动HTTP服务器，监听8080端口，使用CORS中间件
	log.Println("Gateway on :8080") // 记录日志
	_ = http.ListenAndServe(":8080", cors(mux)) // 启动服务器
}

