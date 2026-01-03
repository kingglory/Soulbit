// 导入React Router的Link和useLocation钩子，用于导航和获取当前路径
import { Link, useLocation } from 'react-router-dom';
// 导入导航栏样式文件
import './Navbar.css';
// 导入语言上下文钩子，用于多语言支持
import { useLanguage } from '../context/LanguageContext';

/**
 * 导航栏组件
 * 用于在多页面应用中提供页面导航功能
 * 包含品牌标识和导航链接
 */
function Navbar() {
  // 使用useLocation钩子获取当前页面的路径信息
  const location = useLocation();
  // 使用useLanguage钩子获取翻译函数
  const { t } = useLanguage();
  
  // 导航项配置数组，包含每个导航项的路径和显示标签
  const navItems = [
    { path: '/', label: t('nav.chat') }, // 聊天页面导航项
    { path: '/calendar', label: t('nav.calendar') }, // 日历页面导航项
    { path: '/settings', label: t('nav.settings') }, // 设置页面导航项
  ];

  // 渲染导航栏组件
  return (
    // 导航栏主容器，使用CSS类名"navbar"进行样式控制
    <nav className="navbar">
      {/* 品牌标识区域 */}
      <div className="navbar-brand">
        {/* 品牌链接，点击跳转到首页 */}
        <Link to="/">Soulbit</Link>
      </div>
      
      {/* 导航链接区域 */}
      <div className="navbar-links">
        {/* 遍历导航项配置，生成导航链接 */}
        {navItems.map((item) => (
          // Link组件用于创建导航链接，to属性指定目标路径
          <Link
            key={item.path} // React列表渲染需要唯一key
            to={item.path} // 导航目标路径
            // 动态添加"active"类名，当当前路径与导航项路径匹配时
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label} {/* 导航项显示标签 */}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// 导出Navbar组件，供其他组件使用
export default Navbar;