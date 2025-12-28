package main

// 导入所需库
import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
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

// cors CORS中间件，处理跨域请求
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 设置CORS头信息
		w.Header().Set("Access-Control-Allow-Origin", "*") // 允许所有来源
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type") // 允许Content-Type头
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS") // 允许的HTTP方法
		
		// 处理OPTIONS预检请求
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		
		// 传递请求到下一个处理器
		next.ServeHTTP(w, r)
	})
}

// helloHandler 健康检查接口处理函数
func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json") // 设置响应内容类型为JSON
	_ = json.NewEncoder(w).Encode(helloResp{Message: "Hello from Go"}) // 返回健康检查响应
}

// llmHandler LLM接口处理函数，转发请求到Python服务
func llmHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json") // 设置响应内容类型为JSON
	
	// 解析请求体
	var in llmIn
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		w.WriteHeader(http.StatusBadRequest) // 400错误：请求格式错误
		_ = json.NewEncoder(w).Encode(llmOut{Error: "invalid json"}) // 返回错误信息
		return
	}
	
	// 序列化请求数据
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
	
	// 启动HTTP服务器，监听8080端口，使用CORS中间件
	log.Println("Gateway on :8080") // 记录日志
	_ = http.ListenAndServe(":8080", cors(mux)) // 启动服务器
}

