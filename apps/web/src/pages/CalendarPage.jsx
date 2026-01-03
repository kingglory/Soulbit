// 导入React的状态管理、副作用和引用钩子
import { useState, useEffect, useRef } from 'react'
// 导入语言上下文钩子，用于多语言支持
import { useLanguage } from '../context/LanguageContext'

/**
 * 日历页面组件
 * 负责显示带有阴历转换和传统农历宜忌信息的日历
 * 支持月份切换、今日标记和实时宜忌查询功能
 */
function CalendarPage() {
  // 从语言上下文获取翻译函数
  const { t } = useLanguage();
  
  // 状态管理 - 日历相关
  const [currentDate, setCurrentDate] = useState(new Date()); // 当前显示的日期对象，用于控制月份切换
  
  // 引用管理 - 用于DOM操作和组件交互
  const calendarTitleRef = useRef(null); // 日历标题引用，用于动态更新显示的年月
  const calendarDayRefs = useRef(Array(42).fill(null)); // 日历日期网格引用数组，用于动态渲染42个日期单元格
  const adviceContentRef = useRef(null); // 宜忌信息容器引用，用于动态渲染当日宜忌内容
  
  // 农历月份数组 - 包含中国传统农历的12个月份名称
  const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
  
  // 农历日期数组 - 包含中国传统农历每个月的30个日期名称
  const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  
  /**
   * 生成宜忌信息函数（中国传统农历版）
   * 根据传入的阳历日期生成对应的传统农历宜忌信息
   * 
   * @param {Date} date - 阳历日期对象
   * @returns {Object} 返回包含宜忌信息的对象，包括favorable（宜）和unfavorable（忌）数组
   */
  const generateAdvice = (date) => {
    const lunarDate = getLunarDate(date); // 获取对应的农历日期字符串
    const lunarDay = lunarDate.split('月')[1]; // 提取农历日期（如：初一、十五等）
    
    // 传统中国农历宜事项集合，根据农历日期映射对应的宜事项
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
    
    // 传统中国农历忌事项集合，根据农历日期映射对应的忌事项
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
    
    // 根据农历日期选择对应的宜忌事项，如果没有匹配的日期则使用默认值
    return {
      favorable: traditionalFavorable[lunarDay] || ['宜：祈福', '宜：出行', '宜：祭祀'],
      unfavorable: traditionalUnfavorable[lunarDay] || ['忌：动土', '忌：破土', '忌：安葬']
    };
  };
  
  /**
   * 获取某一天的阴历日期（改进版，根据真实农历月份调整）
   * 将阳历日期转换为对应的农历日期字符串
   * 
   * @param {Date} date - 阳历日期对象
   * @returns {string} 返回农历日期字符串（如：正月初一、腊月十五等）
   */
  const getLunarDate = (date) => {
    const year = date.getFullYear(); // 获取阳历年份
    const month = date.getMonth(); // 获取阳历月份（0-11）
    const day = date.getDate(); // 获取阳历日期（1-31）
    
    // 简单的阴历映射算法（实际项目中应使用更精确的农历库，如lunar-calendar等）
    // 这里根据真实农历月份进行了调整，假设农历比阳历晚2个月
    const lunarMonthOffset = 2; // 农历与阳历的月份偏移量
    const lunarMonthIndex = (month - lunarMonthOffset + 12) % 12; // 计算对应的农历月份索引
    const lunarDayIndex = (day - 1) % 30; // 计算对应的农历日期索引（农历每月30天）
    
    // 组合农历月份和日期，返回完整的农历日期字符串
    return `${lunarMonths[lunarMonthIndex]}${lunarDays[lunarDayIndex]}`;
  };
  
  /**
   * 渲染日历函数
   * 负责根据当前选中的月份动态渲染日历网格，包括月份标题、日期单元格和宜忌信息
   * 处理上个月、当月和下个月的日期显示逻辑
   */
  const renderCalendar = () => {
    const year = currentDate.getFullYear(); // 获取当前显示年份
    const month = currentDate.getMonth(); // 获取当前显示月份
    
    // 更新日历标题，显示当前年月
    if (calendarTitleRef.current) {
      calendarTitleRef.current.textContent = `${year}年${month + 1}月`;
    }
    
    // 获取当月第一天的日期对象
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 获取当月第一天是星期几（0-6，0是周日）
    
    // 获取当月最后一天的日期对象和日期数
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate(); // 获取当月的总天数
    
    // 获取上个月最后一天的日期对象和日期数
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthLastDate = prevMonthLastDay.getDate(); // 获取上个月的总天数
    
    // 初始化日期索引，用于遍历42个日期单元格
    let dayIndex = 0;
    
    // 渲染上个月的日期（显示在当月第一天之前的单元格）
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDate - i; // 计算上个月的具体日期
      if (calendarDayRefs.current[dayIndex]) {
        const el = calendarDayRefs.current[dayIndex];
        el.className = 'calendar-day other-month'; // 添加其他月份的样式
        // 渲染阳历日期和对应的农历日期
        el.innerHTML = `<div class="calendar-day-solar">${day}</div><div class="calendar-day-lunar">${getLunarDate(new Date(year, month - 1, day))}</div>`;
      }
      dayIndex++;
    }
    
    // 渲染当月的日期
    const today = new Date(); // 获取当前系统日期
    for (let day = 1; day <= lastDate; day++) {
      if (calendarDayRefs.current[dayIndex]) {
        const el = calendarDayRefs.current[dayIndex];
        // 判断当前日期是否是今天
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        el.className = `calendar-day ${isToday ? 'today' : ''}`; // 添加日期单元格样式，今天的日期添加特殊样式
        // 渲染阳历日期和对应的农历日期
        el.innerHTML = `<div class="calendar-day-solar">${day}</div><div class="calendar-day-lunar">${getLunarDate(new Date(year, month, day))}</div>`;
        
        // 如果是今天，自动显示今日宜忌信息
        if (isToday) {
          displayAdvice(today);
        }
      }
      dayIndex++;
    }
    
    // 渲染下个月的日期（填充剩余的单元格）
    const remainingDays = 42 - dayIndex; // 计算剩余需要填充的单元格数量
    for (let day = 1; day <= remainingDays; day++) {
      if (calendarDayRefs.current[dayIndex]) {
        const el = calendarDayRefs.current[dayIndex];
        el.className = 'calendar-day other-month'; // 添加其他月份的样式
        // 渲染阳历日期和对应的农历日期
        el.innerHTML = `<div class="calendar-day-solar">${day}</div><div class="calendar-day-lunar">${getLunarDate(new Date(year, month + 1, day))}</div>`;
      }
      dayIndex++;
    }
  };
  
  /**
   * 显示宜忌信息函数
   * 根据传入的日期生成宜忌信息并渲染到页面上
   * 
   * @param {Date} date - 要显示宜忌信息的日期对象
   */
  const displayAdvice = (date) => {
    // 检查宜忌信息容器是否存在
    if (!adviceContentRef.current) return;
    
    const advice = generateAdvice(date); // 生成指定日期的宜忌信息
    let html = ''; // 用于构建HTML内容的字符串
    
    // 构建宜事项的HTML内容
    advice.favorable.forEach(item => {
      html += `<div class="calendar-advice-item favorable">${item}</div>`;
    });
    
    // 构建忌事项的HTML内容
    advice.unfavorable.forEach(item => {
      html += `<div class="calendar-advice-item unfavorable">${item}</div>`;
    });
    
    // 将生成的HTML内容渲染到宜忌信息容器中
    adviceContentRef.current.innerHTML = html;
  };
  
  /**
   * 切换月份函数
   * 根据传入的方向（-1表示上个月，1表示下个月）切换当前显示的月份
   * 
   * @param {number} direction - 月份切换方向，-1表示上个月，1表示下个月
   */
  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      // 创建新的日期对象，切换到指定方向的月份
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
      // 使用setTimeout确保在状态更新后重新渲染日历
      setTimeout(renderCalendar, 0);
      return newDate;
    });
  };
  
  /**
   * 组件副作用钩子
   * 在组件挂载和currentDate状态变化时重新渲染日历
   */
  useEffect(() => {
    renderCalendar(); // 调用渲染日历函数
  }, [currentDate]); // 依赖项为currentDate，当月份变化时重新执行

  // 渲染日历页面UI
  return (
    <div className="calendar-content">
      <h1 className="calendar-page-title">{t('calendar.title')}</h1>
      
      {/* 日历区域 */}
      <div className="calendar-container">
        {/* 日历头部 - 包含月份标题和导航按钮 */}
        <div className="calendar-header">
          <div className="calendar-title" ref={calendarTitleRef}>2025年12月</div>
          <div className="calendar-nav">
            <button onClick={() => changeMonth(-1)}>‹</button> {/* 上个月按钮 */}
            <button onClick={() => changeMonth(1)}>›</button> {/* 下个月按钮 */}
          </div>
        </div>
        
        {/* 日历网格 - 包含星期头部和日期单元格 */}
        <div className="calendar-grid">
          {/* 星期头部 - 显示周日到周六 */}
          {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
            <div key={dayIndex} className="calendar-day-header">{t(`calendar.day.${dayIndex}`)}</div>
          ))}
          {/* 日期网格占位符 - 创建42个日期单元格 */}
          {Array(42).fill(null).map((_, index) => (
            <div key={index} className="calendar-day" ref={el => calendarDayRefs.current[index] = el}></div>
          ))}
        </div>
        
        {/* 宜忌信息区域 - 显示当日的宜事项和忌事项 */}
        <div className="calendar-advice">
          <h4>{t('calendar.today')} {t('calendar.favorable')}/{t('calendar.unfavorable')}</h4>
          <div className="calendar-advice-content" ref={adviceContentRef}></div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;