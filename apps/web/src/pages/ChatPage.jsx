// 导入React的状态管理和副作用钩子
import { useState, useEffect, useRef } from 'react'
// 导入语言上下文钩子，用于多语言支持
import { useLanguage } from '../context/LanguageContext'

/**
 * 聊天页面组件
 * 负责处理用户与智能助手的实时聊天功能
 * 包含WebSocket连接、消息管理、输入处理和聊天界面渲染
 */
function ChatPage() {
  // 从语言上下文获取翻译函数
  const { t } = useLanguage();
  
  // 状态管理 - 聊天相关
  const [hello, setHello] = useState(''); // 服务状态信息，用于显示服务是否可用
  const [prompt, setPrompt] = useState(''); // 用户输入的提示词
  const [messages, setMessages] = useState([]); // 聊天记录列表，存储所有消息
  const [error, setError] = useState(''); // 错误信息，用于显示连接或发送失败等错误
  const [loading, setLoading] = useState(false); // 加载状态，用于显示正在处理中的提示
  const [wsConnected, setWsConnected] = useState(false); // WebSocket连接状态，显示实时连接状态
  
  // 引用管理 - 用于DOM操作和状态持久化
  const messagesEndRef = useRef(null); // 用于自动滚动到底部的引用，指向聊天记录最后一条消息
  const wsRef = useRef(null); // WebSocket连接引用，用于持久化WebSocket连接对象

  /**
   * 组件挂载时执行的副作用
   * 用于检查后端服务状态
   */
  useEffect(() => {
    // 根据环境自动选择API地址，优先使用环境变量配置的地址
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    // 请求Go网关服务的健康检查接口，验证服务是否可用
    fetch(`${apiUrl}/api/hello`)
      .then(r => r.json()) // 解析JSON响应
      .then(d => setHello('在吗: ' + d.message)) // 更新服务状态信息
      .catch(() => setHello('连接失败')); // 处理请求失败情况
  }, []); // 空依赖数组表示仅在组件挂载时执行一次

  /**
   * WebSocket连接管理副作用
   * 负责建立、维护和关闭WebSocket连接
   */
  useEffect(() => {
    // 根据环境自动选择WebSocket地址
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    // 将HTTP协议转换为WebSocket协议（http -> ws, https -> wss）
    const wsProtocol = apiUrl.startsWith('https://') ? 'wss://' : 'ws://';
    // 提取主机名和端口部分
    const wsHost = apiUrl.replace(/^https?:\/\//, '');
    // 构建完整的WebSocket连接URL
    const wsUrl = `${wsProtocol}${wsHost}/api/ws/chat`;

    // 创建WebSocket连接
    wsRef.current = new WebSocket(wsUrl);

    // 连接打开处理函数
    wsRef.current.onopen = () => {
      console.log('WebSocket连接已建立');
      setWsConnected(true); // 更新连接状态为已连接
      setError(''); // 清空之前的错误信息
    };

    // 连接关闭处理函数
    wsRef.current.onclose = () => {
      console.log('WebSocket连接已关闭');
      setWsConnected(false); // 更新连接状态为已断开
    };

    // 错误处理函数
    wsRef.current.onerror = (error) => {
      console.error('WebSocket错误:', error);
      setError('WebSocket连接错误'); // 显示连接错误信息
      setWsConnected(false); // 更新连接状态为已断开
    };

    // 消息接收处理函数
    wsRef.current.onmessage = (event) => {
      try {
        // 解析接收到的JSON格式消息
        const data = JSON.parse(event.data);
        console.log('WebSocket收到消息:', data);
        
        // 根据消息类型更新状态
        if (data.role) {
          // 是聊天消息，添加到聊天记录列表
          setMessages(prev => [...prev, data]);
          setLoading(false); // 关闭加载状态
        } else if (data.error) {
          // 是错误消息，显示错误信息
          setError(data.error);
          setLoading(false); // 关闭加载状态
        }
      } catch (err) {
        // 解析消息失败处理
        console.error('解析WebSocket消息失败:', err);
        setError('消息解析错误'); // 显示解析错误信息
        setLoading(false); // 关闭加载状态
      }
    };

    // 组件卸载时关闭WebSocket连接，防止内存泄漏
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // 空依赖数组表示仅在组件挂载时执行一次
  
  /**
   * 自动滚动到底部的副作用
   * 当聊天记录或加载状态变化时，自动滚动到最新消息
   */
  useEffect(() => {
    // 使用scrollIntoView方法平滑滚动到消息底部
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]); // 依赖聊天记录和加载状态

  /**
   * 表单提交处理函数
   * 负责处理用户发送消息的逻辑
   */
  function submit(e) {
    e.preventDefault(); // 阻止表单默认提交行为
    if (!prompt.trim()) return; // 防止发送空消息
    
    setError(''); // 清空之前的错误信息
    
    // 创建用户消息对象
    const userMessage = {
      id: Date.now(), // 使用时间戳作为唯一ID
      role: 'user', // 消息角色为用户
      content: prompt.trim() // 消息内容
    };
    
    // 将用户消息添加到聊天记录列表
    setMessages(prev => [...prev, userMessage]);
    
    const currentPrompt = prompt.trim();
    setPrompt(''); // 清空输入框
    setLoading(true); // 设置加载状态为true，显示正在处理
    
    // 通过WebSocket发送消息到服务器
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // 发送用户消息到WebSocket服务器
      wsRef.current.send(JSON.stringify({ prompt: currentPrompt }));
    } else {
      // WebSocket未连接，显示错误信息
      setError('WebSocket未连接，请刷新页面重试');
      setLoading(false); // 关闭加载状态
    }
  }

  // 渲染聊天页面UI
  return (
    <div className="chat-container">
      {/* 聊天头部区域 - 显示标题、服务状态和连接状态 */}
      <div className="chat-header">
        <h1>{t('chat.title')}</h1> {/* 页面标题 - 使用翻译函数 */}
        <div className="chat-status">{hello}</div> {/* 服务状态信息 */}
        <div className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`}>
          {wsConnected ? t('chat.connected') : t('chat.disconnected')} {/* WebSocket连接状态显示 - 使用翻译函数 */}
        </div>
      </div>
      
      {/* 聊天记录区域 - 显示所有聊天消息 */}
      <div className="chat-messages">
        {/* 渲染聊天记录列表 */}
        {messages.map(message => {
          // 根据消息角色决定元素顺序（用户消息：内容在左，头像在右；助手消息：头像在左，内容在右）
          const elements = message.role === 'user' ? [
            <div key="content" className="message-content">{message.content}</div>,
            <div key="avatar" className={`avatar ${message.role}`} title={message.role === 'user' ? '我' : 'SoulBit'}>
              {message.role === 'user' ? '😊' : 'S'} {/* 用户头像使用表情，助手头像使用首字母 */}
            </div>
          ] : [
            <div key="avatar" className={`avatar ${message.role}`} title={message.role === 'user' ? '我' : 'SoulBit'}>
              {message.role === 'user' ? '😊' : 'S'} {/* 用户头像使用表情，助手头像使用首字母 */}
            </div>,
            <div key="content" className="message-content">{message.content}</div>
          ];
          
          // 渲染单个消息组件
          return (
            <div key={message.id} className={`message ${message.role}`}>
              {elements}
            </div>
          );
        })}
        
        {/* 条件渲染加载组件 - 当loading为true时显示 */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div> {/* 加载动画图标 */}
            <span className="loading-text">{t('chat.loading')}</span> {/* 加载提示文本 - 使用翻译函数 */}
          </div>
        )}
        
        {/* 条件渲染错误信息 - 当error不为空时显示 */}
        {error !== '' && <div className="error-message">{error}</div>}
        
        {/* 用于自动滚动的锚点 - 指向聊天记录末尾 */}
        <div ref={messagesEndRef}></div>
      </div>
      
      {/* 输入区域 - 用于用户输入和发送消息 */}
      <div className="chat-input-area">
        <form onSubmit={submit} className="chat-form">
          {/* 文本输入框 - 支持多行输入 */}
          <textarea 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} // 输入框内容变化事件处理
            onKeyDown={(e) => {
              // 按回车键且不按Shift键时发送消息（支持Shift+Enter换行）
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // 阻止默认的换行行为
                submit(e); // 调用提交函数发送消息
              }
            }}
            placeholder={t('chat.inputPlaceholder')} // 提示文本 - 使用翻译函数
            rows={3} // 输入框默认行数
          />
          {/* 提交按钮 - 用于发送消息 */}
          <button type="submit">{t('chat.send')}</button>
        </form>
      </div>
    </div>
  );
}

// 导出ChatPage组件，供其他组件使用
export default ChatPage;