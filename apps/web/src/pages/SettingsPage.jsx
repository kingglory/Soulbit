// 导入React的状态管理钩子
import { useState, useEffect } from 'react'
// 导入语言上下文钩子，用于多语言支持
import { useLanguage } from '../context/LanguageContext'

/**
 * 设置页面组件
 * 负责管理应用的各种设置选项，包括主题、语言、通知和API配置等
 * 支持设置的实时保存和本地持久化存储
 */
function SettingsPage() {
  // 从语言上下文获取语言和语言切换函数
  const { language, changeLanguage, t } = useLanguage();
  
  // 设置相关状态
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light'); // 主题设置（light/dark），优先从本地存储获取，默认light
  const [notifications, setNotifications] = useState(localStorage.getItem('notifications') ? JSON.parse(localStorage.getItem('notifications')) : true); // 通知设置，优先从本地存储获取，默认开启
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('apiUrl') || 'http://localhost:8080'); // API地址设置，优先从本地存储获取，默认值为http://localhost:8080

  /**
   * 处理API地址变更的函数
   * 当用户修改API地址输入框时调用，更新状态并保存到本地存储
   * 
   * @param {Event} e - 输入框变更事件对象
   */
  const handleApiUrlChange = (e) => {
    const newUrl = e.target.value; // 获取用户输入的新API地址
    setApiUrl(newUrl); // 更新API地址状态
    localStorage.setItem('apiUrl', newUrl); // 将新API地址保存到本地存储，实现持久化
  };

  /**
   * 切换主题的函数
   * 用于在浅色模式和深色模式之间切换
   * 更新状态、HTML根元素的主题属性和本地存储
   */
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'; // 计算新的主题模式
    setTheme(newTheme); // 更新主题状态
    document.documentElement.setAttribute('data-theme', newTheme); // 设置HTML根元素的data-theme属性，用于CSS主题切换
    localStorage.setItem('theme', newTheme); // 将新主题保存到本地存储，实现持久化
  };

  /**
   * 组件挂载时的副作用钩子
   * 用于初始化主题设置，确保页面刷新后主题能够正确显示
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme); // 将当前主题应用到DOM
  }, [theme]); // 当theme状态变化时重新执行

  /**
   * 切换通知设置的函数
   * 用于开启或关闭通知功能
   * 更新状态并将设置保存到本地存储
   */
  const toggleNotifications = () => {
    setNotifications(!notifications); // 切换通知状态
    localStorage.setItem('notifications', JSON.stringify(!notifications)); // 将新的通知设置保存到本地存储，实现持久化
  };

  // 渲染设置页面UI
  return (
    <div className="settings-content">
      <h1 className="settings-page-title">{t('settings.title')}</h1>
      
      <div className="settings-sections">
        {/* 主题设置部分 */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('settings.theme')}</h2>
          <div className="settings-item">
            <label className="settings-label">
              <input 
                type="checkbox" 
                checked={theme === 'dark'} 
                onChange={toggleTheme}
              />
              <span className="settings-checkbox-label">{t('settings.darkMode')}</span>
            </label>
          </div>
        </div>

        {/* 语言设置部分 */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('settings.language')}</h2>
          <div className="settings-item">
            <select 
              value={language} 
              onChange={(e) => changeLanguage(e.target.value)} // 使用语言上下文的changeLanguage函数
              className="settings-select"
            >
              <option value="zh-CN">中文 (简体)</option>
              <option value="zh-TW">中文 (繁体)</option>
              <option value="en-US">English (US)</option>
            </select>
          </div>
        </div>

        {/* 通知设置部分 */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('settings.notifications')}</h2>
          <div className="settings-item">
            <label className="settings-label">
              <input 
                type="checkbox" 
                checked={notifications} 
                onChange={toggleNotifications}
              />
              <span className="settings-checkbox-label">{t('settings.receiveNotifications')}</span>
            </label>
          </div>
        </div>

        {/* API配置部分 */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('settings.api')}</h2>
          <div className="settings-item">
            <label className="settings-label">{t('settings.apiUrl')}:</label>
            <input 
              type="text" 
              value={apiUrl} 
              onChange={handleApiUrlChange}
              className="settings-input"
              placeholder="http://localhost:8080"
            />
          </div>
        </div>

        {/* 关于信息部分 */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('settings.about')}</h2>
          <div className="settings-item">
            <p className="settings-about-text">{t('settings.version')}</p>
            <p className="settings-about-text">{t('settings.description')}</p>
            <p className="settings-about-text">{t('settings.copyright')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;