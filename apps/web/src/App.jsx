import { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  // 状态管理
  const [hello, setHello] = useState(''); // 服务状态信息
  const [prompt, setPrompt] = useState(''); // 用户输入的提示词
  const [messages, setMessages] = useState([]); // 聊天记录列表
  const [error, setError] = useState(''); // 错误信息
  const [loading, setLoading] = useState(false); // 加载状态
  const [wsConnected, setWsConnected] = useState(false); // WebSocket连接状态
  const messagesEndRef = useRef(null); // 用于自动滚动到底部的引用
  const wsRef = useRef(null); // WebSocket连接引用
  
  // 日历相关状态
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarTitleRef = useRef(null);
  const calendarDayRefs = useRef(Array(42).fill(null));
  const adviceContentRef = useRef(null);
  
  // 简单的阴历转换（简化版，仅作演示）
  const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
  const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  
  // 生成宜忌信息（中国传统农历版）
  const generateAdvice = (date) => {
    const lunarDate = getLunarDate(date);
    const lunarDay = lunarDate.split('月')[1];
    
    // 传统中国农历宜忌（根据农历日期）
    const traditionalFavorable = {
      '初一': ['宜：祭祀', '宜：祈福', '宜：斋醮', '宜：会亲友'],
      '初二': ['宜：祈福', '宜：嫁娶', '宜：纳采', '宜：订盟'],
      '初三': ['宜：出行', '宜：祭祀', '宜：祈福', '宜：斋醮'],
      '初四': ['宜：祭祀', '宜：祈福', '宜：求嗣', '宜：斋醮'],
      '初五': ['宜：嫁娶', '宜：祭祀', '宜：祈福', '宜：出行'],
      '初六': ['宜：嫁娶', '宜：纳采', '宜：订盟', '宜：祭祀'],
      '初七': ['宜：祭祀', '宜：祈福', '宜：求嗣', '宜：斋醮'],
      '初八': ['宜：嫁娶', '宜：祭祀', '宜：祈福', '宜：求嗣'],
      '初九': ['宜：祭祀', '宜：祈福', '宜：斋醮', '宜：出行'],
      '初十': ['宜：祭祀', '宜：祈福', '宜：斋醮', '宜：会亲友'],
      '十五': ['宜：祭祀', '宜：祈福', '宜：斋醮', '宜：嫁娶'],
      '廿八': ['宜：嫁娶', '宜：纳采', '宜：订盟', '宜：祭祀'],
      '三十': ['宜：祭祀', '宜：祈福', '宜：斋醮', '宜：会亲友']
    };
    
    const traditionalUnfavorable = {
      '初一': ['忌：嫁娶', '忌：安葬', '忌：破土', '忌：动土'],
      '初二': ['忌：开市', '忌：安葬', '忌：破土', '忌：动土'],
      '初三': ['忌：嫁娶', '忌：安葬', '忌：破土', '忌：动土'],
      '初四': ['忌：嫁娶', '忌：安葬', '忌：破土', '忌：动土'],
      '初五': ['忌：开市', '忌：安葬', '忌：破土', '忌：动土'],
      '初六': ['忌：开市', '忌：安葬', '忌：破土', '忌：动土'],
      '初七': ['忌：嫁娶', '忌：安葬', '忌：破土', '忌：动土'],
      '初八': ['忌：开市', '忌：安葬', '忌：破土', '忌：动土'],
      '初九': ['忌：嫁娶', '忌：安葬', '忌：破土', '忌：动土'],
      '初十': ['忌：嫁娶', '忌：安葬', '忌：破土', '忌：动土'],
      '十五': ['忌：开市', '忌：安葬', '忌：破土', '忌：动土'],
      '廿八': ['忌：开市', '忌：安葬', '忌：破土', '忌：动土'],
      '三十': ['忌：嫁娶', '忌：安葬', '忌：破土', '忌：动土']
    };
    
    // 根据农历日期选择宜忌，如果没有匹配则使用默认值
    return {
      favorable: traditionalFavorable[lunarDay] || ['宜：祈福', '宜：出行', '宜：祭祀'],
      unfavorable: traditionalUnfavorable[lunarDay] || ['忌：动土', '忌：破土', '忌：安葬']
    };
  };
  
  // 获取某一天的阴历日期（改进版，根据真实农历月份调整）
  const getLunarDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // 简单的阴历映射（实际项目中应使用更精确的库）
    // 这里根据真实农历月份进行了调整
    const lunarMonthOffset = 2; // 假设农历比阳历晚2个月
    const lunarMonthIndex = (month - lunarMonthOffset + 12) % 12;
    const lunarDayIndex = (day - 1) % 30;
    
    return `${lunarMonths[lunarMonthIndex]}${lunarDays[lunarDayIndex]}`;
  };
  
  // 渲染日历
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 更新标题
    if (calendarTitleRef.current) {
      calendarTitleRef.current.textContent = `${year}年${month + 1}月`;
    }
    
    // 获取当月第一天
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0-6，0是周日
    
    // 获取当月最后一天
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();
    
    // 获取上个月最后一天
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthLastDate = prevMonthLastDay.getDate();
    
    // 渲染日期网格
    let dayIndex = 0;
    
    // 渲染上个月的日期
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDate - i;
      if (calendarDayRefs.current[dayIndex]) {
        const el = calendarDayRefs.current[dayIndex];
        el.className = 'calendar-day other-month';
        el.innerHTML = `<div class="calendar-day-solar">${day}</div><div class="calendar-day-lunar">${getLunarDate(new Date(year, month - 1, day))}</div>`;
      }
      dayIndex++;
    }
    
    // 渲染当月的日期
    const today = new Date();
    for (let day = 1; day <= lastDate; day++) {
      if (calendarDayRefs.current[dayIndex]) {
        const el = calendarDayRefs.current[dayIndex];
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        el.className = `calendar-day ${isToday ? 'today' : ''}`;
        el.innerHTML = `<div class="calendar-day-solar">${day}</div><div class="calendar-day-lunar">${getLunarDate(new Date(year, month, day))}</div>`;
        
        // 如果是今天，显示宜忌信息
        if (isToday) {
          displayAdvice(today);
        }
      }
      dayIndex++;
    }
    
    // 渲染下个月的日期
    const remainingDays = 42 - dayIndex;
    for (let day = 1; day <= remainingDays; day++) {
      if (calendarDayRefs.current[dayIndex]) {
        const el = calendarDayRefs.current[dayIndex];
        el.className = 'calendar-day other-month';
        el.innerHTML = `<div class="calendar-day-solar">${day}</div><div class="calendar-day-lunar">${getLunarDate(new Date(year, month + 1, day))}</div>`;
      }
      dayIndex++;
    }
  };
  
  // 显示宜忌信息
  const displayAdvice = (date) => {
    if (!adviceContentRef.current) return;
    
    const advice = generateAdvice(date);
    let html = '';
    
    advice.favorable.forEach(item => {
      html += `<div class="calendar-advice-item favorable">${item}</div>`;
    });
    
    advice.unfavorable.forEach(item => {
      html += `<div class="calendar-advice-item unfavorable">${item}</div>`;
    });
    
    adviceContentRef.current.innerHTML = html;
  };
  
  // 切换月份
  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
      setTimeout(renderCalendar, 0);
      return newDate;
    });
  };
  
  // 组件挂载时渲染日历
  useEffect(() => {
    renderCalendar();
  }, [currentDate]);

  // 组件挂载时执行，检查服务状态
  useEffect(() => {
    // 根据环境自动选择API地址
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    fetch(`${apiUrl}/api/hello`) // 请求Go网关服务的健康检查接口
      .then(r => r.json()) // 解析JSON响应
      .then(d => setHello('在吗: ' + d.message)) // 更新服务状态
      .catch(() => setHello('连接失败')); // 处理错误
  }, []);

  // WebSocket连接管理
  useEffect(() => {
    // 根据环境自动选择WebSocket地址
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    // 将HTTP协议转换为WebSocket协议
    const wsProtocol = apiUrl.startsWith('https://') ? 'wss://' : 'ws://';
    const wsHost = apiUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}${wsHost}/api/ws/chat`;

    // 创建WebSocket连接
    wsRef.current = new WebSocket(wsUrl);

    // 连接打开处理
    wsRef.current.onopen = () => {
      console.log('WebSocket连接已建立');
      setWsConnected(true);
      setError('');
    };

    // 连接关闭处理
    wsRef.current.onclose = () => {
      console.log('WebSocket连接已关闭');
      setWsConnected(false);
    };

    // 错误处理
    wsRef.current.onerror = (error) => {
      console.error('WebSocket错误:', error);
      setError('WebSocket连接错误');
      setWsConnected(false);
    };

    // 消息接收处理
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket收到消息:', data);
        
        // 根据消息类型更新状态
        if (data.role) {
          // 是聊天消息，添加到消息列表
          setMessages(prev => [...prev, data]);
          setLoading(false);
        } else if (data.error) {
          // 是错误消息
          setError(data.error);
          setLoading(false);
        }
      } catch (err) {
        console.error('解析WebSocket消息失败:', err);
        setError('消息解析错误');
        setLoading(false);
      }
    };

    // 组件卸载时关闭WebSocket连接
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  // 自动滚动到底部的效果
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 表单提交处理函数
  function submit(e) {
    e.preventDefault(); // 阻止表单默认提交行为
    if (!prompt.trim()) return; // 防止空消息
    
    setError(''); // 清空之前的错误信息
    
    // 将用户消息添加到聊天记录
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: prompt.trim()
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentPrompt = prompt.trim();
    setPrompt(''); // 清空输入框
    setLoading(true); // 设置加载状态为true
    
    // 通过WebSocket发送消息
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // 发送用户消息到WebSocket服务器
      wsRef.current.send(JSON.stringify({ prompt: currentPrompt }));
    } else {
      // WebSocket未连接，显示错误
      setError('WebSocket未连接，请刷新页面重试');
      setLoading(false);
    }
  }

  return (
    <div className="main-container">
      {/* 日历区域 - 独立于聊天框，只占很小一块 */}
      <div className="calendar-container">
        {/* 日历头部 */}
        <div className="calendar-header">
          <div className="calendar-title" ref={calendarTitleRef}>2025年12月</div>
          <div className="calendar-nav">
            <button onClick={() => changeMonth(-1)}>‹</button>
            <button onClick={() => changeMonth(1)}>›</button>
          </div>
        </div>
        {/* 日历网格 */}
        <div className="calendar-grid">
          {/* 星期头部 */}
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {/* 日期网格占位符 */}
          {Array(42).fill(null).map((_, index) => (
            <div key={index} className="calendar-day" ref={el => calendarDayRefs.current[index] = el}></div>
          ))}
        </div>
        {/* 宜忌信息 */}
        <div className="calendar-advice">
          <h4>今日宜忌</h4>
          <div className="calendar-advice-content" ref={adviceContentRef}></div>
        </div>
      </div>
      
      {/* 聊天容器 - 占大部分布局 */}
      <div className="chat-container">
        {/* 聊天头部 */}
        <div className="chat-header">
          <h1>Soulbit</h1> {/* 页面标题 */}
          <div className="chat-status">{hello}</div> {/* 服务状态 */}
          <div className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? '实时连接' : '连接断开'}
          </div>
        </div>
        
        {/* 聊天记录区域 */}
        <div className="chat-messages">
          {/* 渲染聊天记录 */}
          {messages.map(message => {
            // 根据消息角色决定元素顺序
            const elements = message.role === 'user' ? [
              <div key="content" className="message-content">{message.content}</div>,
              <div key="avatar" className={`avatar ${message.role}`} title={message.role === 'user' ? '我' : 'SoulBit'}>
                {message.role === 'user' ? '😊' : 'S'}
              </div>
            ] : [
              <div key="avatar" className={`avatar ${message.role}`} title={message.role === 'user' ? '我' : 'SoulBit'}>
                {message.role === 'user' ? '😊' : 'S'}
              </div>,
              <div key="content" className="message-content">{message.content}</div>
            ];
            
            return (
              <div key={message.id} className={`message ${message.role}`}>
                {elements}
              </div>
            );
          })}
          
          {/* 条件渲染加载组件（只有当loading为true时才显示） */}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div> {/* 加载动画 */}
              <span className="loading-text">正在思考中...</span> {/* 加载文本 */}
            </div>
          )}
          
          {/* 条件渲染错误信息（只有当error不为空字符串时才显示） */}
          {error !== '' && <div className="error-message">{error}</div>}
          
          {/* 用于自动滚动的锚点 */}
          <div ref={messagesEndRef}></div>
        </div>
        
        {/* 输入区域 */}
        <div className="chat-input-area">
          <form onSubmit={submit} className="chat-form">
            <textarea 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} // 输入框变化事件
              onKeyDown={(e) => {
                // 按回车键且不按Shift键时发送消息
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault(); // 阻止默认的换行行为
                  submit(e); // 调用提交函数
                }
              }}
              placeholder="输入您的问题或想法..." 
              rows={3}
            />
            <button type="submit">发送</button> {/* 提交按钮 */}
          </form>
        </div>
      </div>
    </div>
  );
}

export default App
