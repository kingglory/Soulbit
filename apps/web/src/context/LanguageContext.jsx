// 导入React的createContext、useContext和useState钩子
import { createContext, useContext, useState, useEffect } from 'react';

// 创建翻译文本对象，包含所有支持的语言
const translations = {
  'zh-CN': {
    // 导航栏文本
    'nav.chat': '聊天',
    'nav.calendar': '日历',
    'nav.settings': '设置',
    // 设置页面文本
    'settings.title': '设置',
    'settings.theme': '主题',
    'settings.darkMode': '深色模式',
    'settings.language': '语言',
    'settings.notifications': '通知',
    'settings.receiveNotifications': '接收通知',
    'settings.api': 'API配置',
    'settings.apiUrl': 'API地址',
    'settings.about': '关于',
    'settings.version': 'Soulbit v1.0.0',
    'settings.description': '基于现代Web技术构建的智能助手',
    'settings.copyright': '© 2026 Soulbit Team',
    // 聊天页面文本
    'chat.title': '聊天',
    'chat.inputPlaceholder': '输入消息...',
    'chat.send': '发送',
    'chat.connectionStatus': '连接状态',
    'chat.connected': '已连接',
    'chat.disconnected': '已断开',
    'chat.connecting': '连接中...',
    'chat.loading': '正在思考中...',
    // 日历页面文本
    'calendar.title': '日历',
    'calendar.today': '今天',
    'calendar.favorable': '宜',
    'calendar.unfavorable': '忌',
    'calendar.loading': '加载中...',
    // 月份名称
    'calendar.month.1': '一月',
    'calendar.month.2': '二月',
    'calendar.month.3': '三月',
    'calendar.month.4': '四月',
    'calendar.month.5': '五月',
    'calendar.month.6': '六月',
    'calendar.month.7': '七月',
    'calendar.month.8': '八月',
    'calendar.month.9': '九月',
    'calendar.month.10': '十月',
    'calendar.month.11': '十一月',
    'calendar.month.12': '十二月',
    // 星期名称
    'calendar.day.0': '日',
    'calendar.day.1': '一',
    'calendar.day.2': '二',
    'calendar.day.3': '三',
    'calendar.day.4': '四',
    'calendar.day.5': '五',
    'calendar.day.6': '六',
  },
  'zh-TW': {
    // 导航栏文本
    'nav.chat': '聊天',
    'nav.calendar': '日曆',
    'nav.settings': '設置',
    // 设置页面文本
    'settings.title': '設置',
    'settings.theme': '主題',
    'settings.darkMode': '深色模式',
    'settings.language': '語言',
    'settings.notifications': '通知',
    'settings.receiveNotifications': '接收通知',
    'settings.api': 'API配置',
    'settings.apiUrl': 'API地址',
    'settings.about': '關於',
    'settings.version': 'Soulbit v1.0.0',
    'settings.description': '基於現代Web技術構建的智能助手',
    'settings.copyright': '© 2026 Soulbit Team',
    // 聊天页面文本
    'chat.title': '聊天',
    'chat.inputPlaceholder': '輸入消息...',
    'chat.send': '發送',
    'chat.connectionStatus': '連接狀態',
    'chat.connected': '已連接',
    'chat.disconnected': '已斷開',
    'chat.connecting': '連接中...',
    // 日历页面文本
    'calendar.title': '日曆',
    'calendar.today': '今天',
    'calendar.favorable': '宜',
    'calendar.unfavorable': '忌',
    'calendar.loading': '加載中...',
    // 月份名称
    'calendar.month.1': '一月',
    'calendar.month.2': '二月',
    'calendar.month.3': '三月',
    'calendar.month.4': '四月',
    'calendar.month.5': '五月',
    'calendar.month.6': '六月',
    'calendar.month.7': '七月',
    'calendar.month.8': '八月',
    'calendar.month.9': '九月',
    'calendar.month.10': '十月',
    'calendar.month.11': '十一月',
    'calendar.month.12': '十二月',
    // 星期名称
    'calendar.day.0': '日',
    'calendar.day.1': '一',
    'calendar.day.2': '二',
    'calendar.day.3': '三',
    'calendar.day.4': '四',
    'calendar.day.5': '五',
    'calendar.day.6': '六',
  },
  'en-US': {
    // 导航栏文本
    'nav.chat': 'Chat',
    'nav.calendar': 'Calendar',
    'nav.settings': 'Settings',
    // 设置页面文本
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.darkMode': 'Dark Mode',
    'settings.language': 'Language',
    'settings.notifications': 'Notifications',
    'settings.receiveNotifications': 'Receive Notifications',
    'settings.api': 'API Configuration',
    'settings.apiUrl': 'API URL',
    'settings.about': 'About',
    'settings.version': 'Soulbit v1.0.0',
    'settings.description': 'Intelligent assistant built with modern web technologies',
    'settings.copyright': '© 2026 Soulbit Team',
    // 聊天页面文本
    'chat.title': 'Chat',
    'chat.inputPlaceholder': 'Type a message...',
    'chat.send': 'Send',
    'chat.connectionStatus': 'Connection Status',
    'chat.connected': 'Connected',
    'chat.disconnected': 'Disconnected',
    'chat.connecting': 'Connecting...',
    // 日历页面文本
    'calendar.title': 'Calendar',
    'calendar.today': 'Today',
    'calendar.favorable': 'Favorable',
    'calendar.unfavorable': 'Unfavorable',
    'calendar.loading': 'Loading...',
    // 月份名称
    'calendar.month.1': 'January',
    'calendar.month.2': 'February',
    'calendar.month.3': 'March',
    'calendar.month.4': 'April',
    'calendar.month.5': 'May',
    'calendar.month.6': 'June',
    'calendar.month.7': 'July',
    'calendar.month.8': 'August',
    'calendar.month.9': 'September',
    'calendar.month.10': 'October',
    'calendar.month.11': 'November',
    'calendar.month.12': 'December',
    // 星期名称
    'calendar.day.0': 'Sun',
    'calendar.day.1': 'Mon',
    'calendar.day.2': 'Tue',
    'calendar.day.3': 'Wed',
    'calendar.day.4': 'Thu',
    'calendar.day.5': 'Fri',
    'calendar.day.6': 'Sat',
  },
};

// 创建语言上下文
const LanguageContext = createContext();

// 创建语言提供者组件
export const LanguageProvider = ({ children }) => {
  // 从本地存储获取语言设置，如果没有则使用默认值'zh-CN'
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'zh-CN');

  // 翻译函数，根据当前语言返回对应的翻译文本
  const t = (key) => {
    // 检查是否有当前语言的翻译，如果没有则返回键名
    return translations[language]?.[key] || key;
  };

  // 切换语言的函数
  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // 在组件挂载时，从本地存储加载语言设置
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // 提供语言上下文值
  const value = {
    language,
    t,
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// 创建自定义钩子，方便组件使用语言上下文
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
