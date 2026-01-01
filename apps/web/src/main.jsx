import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // 全局样式
import App from './App.jsx'// 主应用组件
// 渲染应用到 DOM 元素
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
