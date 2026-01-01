import { defineConfig } from 'vite'// 导入 Vite 配置函数
import react from '@vitejs/plugin-react'// React 插件，用于支持 React 开发
//Vite配置文件，可自定义构建和开发服务器
// https://vite.dev/config/
export default defineConfig({// 定义 Vite 配置
  plugins: [react()],// 使用 React 插件
})
