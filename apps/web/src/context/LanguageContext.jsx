// 导入React的createContext、useContext和useState钩子
import { createContext, useContext, useState, useEffect } from 'react';

// 创建翻译文本对象，包含所有支持的语言
const translations = {
  'zh-CN': {
        // 导航栏文本
        'nav.chat': '聊天',
        'nav.calendar': '日历',
        'nav.game': '游戏',
        'nav.settings': '设置',
        // 游戏页面文本
        'game.title': 'AI算命小游戏',
        'game.description': '结合中国传统命理文化与现代AI技术的互动小游戏',
        'game.fiveElements': '五行匹配游戏',
        'game.fiveElementsDesc': '测试你对五行相生相克的了解程度',
        'game.fortuneTelling': 'AI算命',
        'game.fortuneTellingDesc': '获取个性化的命理解读',
        'game.startGame': '开始游戏',
        'game.back': '返回',
        'game.score': '得分',
        'game.time': '时间',
        'game.round': '回合',
        'game.whatGenerates': '{{element}}生什么？',
        'game.whatConquers': '{{element}}克什么？',
        'game.correct': '回答正确！',
        'game.incorrect': '回答错误！',
        'game.gameOver': '游戏结束',
        'game.finalScore': '最终得分',
        'game.timeRemaining': '剩余时间',
        'game.correctAnswers': '正确答案',
        'game.seconds': '秒',
        'game.playAgain': '再玩一次',
        'game.backToMenu': '返回菜单',
        'game.analysisExample1': '根据你的游戏表现，你具有较强的逻辑思维能力。',
        'game.analysisExample2': '你的决策速度较快，属于果断型性格。',
        'game.analysisExample3': '建议你在生活中保持这种积极的态度，相信会有更好的运气。',
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
        'nav.game': '遊戲',
        'nav.settings': '設置',
        // 游戏页面文本
        'game.title': 'AI算命小遊戲',
        'game.description': '結合中國傳統命理文化與現代AI技術的互動小遊戲',
        'game.fiveElements': '五行匹配遊戲',
        'game.fiveElementsDesc': '測試你對五行相生相克的了解程度',
        'game.fortuneTelling': 'AI算命',
        'game.fortuneTellingDesc': '獲取個性化的命理解讀',
        'game.startGame': '開始遊戲',
        'game.back': '返回',
        'game.score': '得分',
        'game.time': '時間',
        'game.round': '回合',
        'game.whatGenerates': '{{element}}生什麼？',
        'game.whatConquers': '{{element}}克什麼？',
        'game.correct': '回答正確！',
        'game.incorrect': '回答錯誤！',
        'game.gameOver': '遊戲結束',
        'game.finalScore': '最終得分',
        'game.timeRemaining': '剩餘時間',
        'game.correctAnswers': '正確答案',
        'game.seconds': '秒',
        'game.playAgain': '再玩一次',
        'game.backToMenu': '返回菜單',
        'game.analysisExample1': '根據你的遊戲表現，你具有較強的邏輯思維能力。',
        'game.analysisExample2': '你的決策速度較快，屬於果斷型性格。',
        'game.analysisExample3': '建議你在生活中保持這種積極的態度，相信會有更好的運氣。',
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
        'nav.game': 'Game',
        'nav.settings': 'Settings',
        // 游戏页面文本
        'game.title': 'AI Fortune Telling Game',
        'game.description': 'An interactive game combining traditional Chinese numerology culture with modern AI technology',
        'game.fiveElements': 'Five Elements Matching Game',
        'game.fiveElementsDesc': 'Test your knowledge of the Five Elements theory',
        'game.fortuneTelling': 'AI Fortune Telling',
        'game.fortuneTellingDesc': 'Get personalized numerology interpretation',
        'game.startGame': 'Start Game',
        'game.back': 'Back',
        'game.score': 'Score',
        'game.time': 'Time',
        'game.round': 'Round',
        'game.whatGenerates': 'What does {{element}} generate?',
        'game.whatConquers': 'What does {{element}} conquer?',
        'game.correct': 'Correct!',
        'game.incorrect': 'Incorrect!',
        'game.gameOver': 'Game Over',
        'game.finalScore': 'Final Score',
        'game.timeRemaining': 'Time Remaining',
        'game.correctAnswers': 'Correct Answers',
        'game.seconds': 'seconds',
        'game.playAgain': 'Play Again',
        'game.backToMenu': 'Back to Menu',
        'game.analysisExample1': 'Based on your game performance, you have strong logical thinking skills.',
        'game.analysisExample2': 'Your decision-making speed is fast, indicating a decisive personality.',
        'game.analysisExample3': 'It is suggested that you maintain this positive attitude in life, which will bring you better luck.',
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

  // 翻译函数，根据当前语言返回对应的翻译文本，支持模板变量替换
  const t = (key, variables = {}) => {
    // 检查是否有当前语言的翻译，如果没有则返回键名
    let translation = translations[language]?.[key] || key;
    
    // 替换模板变量，格式：{{variable}} -> value
    Object.entries(variables).forEach(([name, value]) => {
      translation = translation.replace(new RegExp(`{{${name}}}`, 'g'), value);
    });
    
    return translation;
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
