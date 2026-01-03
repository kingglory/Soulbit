// 导入React Router的核心组件，用于实现客户端路由功能
// BrowserRouter：提供路由上下文，整个应用的路由根组件
// Routes：路由容器，用于包裹多个Route组件
// Route：定义路由规则，指定路径与组件的映射关系
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// 导入导航栏组件，用于实现页面之间的切换导航
import Navbar from './components/Navbar'

// 导入各个页面组件
import ChatPage from './pages/ChatPage' // 聊天页面组件，负责处理用户与智能助手的实时聊天
import CalendarPage from './pages/CalendarPage' // 日历页面组件，提供日历视图和传统农历宜忌信息
import SettingsPage from './pages/SettingsPage' // 设置页面组件，用于管理应用的各种设置选项

// 导入全局样式文件，定义应用的基础样式和主题
import './index.css'

// 导入语言上下文提供者，用于实现多语言支持
import { LanguageProvider } from './context/LanguageContext'


/**
 * 应用的主组件
 * 负责配置整个应用的路由结构和基本布局
 * 是React应用的入口组件之一
 */
function App() {
  return (
    // 使用LanguageProvider包裹整个应用，提供多语言支持
    // 使用BrowserRouter包裹整个应用，提供路由功能
    <LanguageProvider>
      <BrowserRouter>
        {/* 应用的主容器，包含导航栏和页面内容区域 */}
        <div className="app-container">
          {/* 导航栏组件，固定在页面顶部，提供页面切换功能 */}
          <Navbar />
          
          {/* 页面内容区域，根据当前路由动态渲染对应的页面组件 */}
          <div className="page-content">
            {/* Routes组件，用于定义所有的路由规则 */}
            <Routes>
              {/* 根路径路由，渲染聊天页面组件 */}
              <Route path="/" element={<ChatPage />} />
              {/* 日历页面路由，渲染日历页面组件 */}
              <Route path="/calendar" element={<CalendarPage />} />
              {/* 设置页面路由，渲染设置页面组件 */}
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App
