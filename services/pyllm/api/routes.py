# -*- coding: utf-8 -*-
"""
API路由模块
"""
import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from ..utils.logger import logger
from ..database.db import save_message
from ..api.models import PromptIn, LLMOut
from ..agents.langchain_agent import global_workflow

# 创建FastAPI应用实例
app = FastAPI()

# LLM接口
@app.post("/llm", response_model=LLMOut)
async def llm(in_data: PromptIn):
    """
    LLM对话接口，接收用户提示词并返回模型回复
    
    Args:
        in_data: 包含用户提示词的请求数据
        
    Returns:
        包含模型回复的响应数据
    """
    logger.info(f"接收到LLM请求，原始输入: {in_data.prompt}")
    
    prompt = in_data.prompt.strip()  # 获取并清理提示词
    logger.info(f"处理后的提示词: {prompt}")
    
    reply = f"Echo: {prompt}"  # 默认回复（回声模式）
    logger.info(f"初始设置为回声模式，默认回复: {reply}")
    
    # 尝试使用ModelScope API（如果有配置）
    ms_api_key = os.getenv("MODELSCOPE_API_KEY", "")
    logger.info(f"检查ModelScope API密钥: {'已配置' if ms_api_key else '未配置'}")
    
    if ms_api_key:
        logger.info("开始使用基于LangChain的多Agent系统处理请求")
        try:
            # 使用多Agent工作流生成回复
            final_reply = None
            async for step in global_workflow.run(prompt):
                if step["is_final"]:
                    final_reply = step["content"]
                    logger.info(f"多Agent系统生成最终回复成功: {final_reply[:50]}...")
            
            if final_reply:
                reply = final_reply
            else:
                logger.error("多Agent系统返回空回复")
                return LLMOut(reply=reply, error="LLM call failed")
            
        except Exception as e:
            logger.error(f"多Agent系统调用失败: {str(e)}")
            return LLMOut(reply=reply, error="LLM call failed")
    else:
        logger.error("未配置ModelScope API密钥，直接返回错误")
        return LLMOut(reply=reply, error="LLM call failed")
    
    # 保存对话记录到数据库
    save_message(prompt, reply)
    
    logger.info(f"LLM请求处理完成，最终回复: {reply}")
    return LLMOut(reply=reply)  # 返回回复

# WebSocket接口
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket聊天接口，支持实时消息传输和流式输出
    
    Args:
        websocket: WebSocket连接实例
    """
    await websocket.accept()  # 接受WebSocket连接
    logger.info("WebSocket连接已建立")
    
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()
            logger.info(f"WebSocket接收到消息: {data}")
            
            # 解析消息
            try:
                message = json.loads(data)
                prompt = message.get("prompt", "").strip()
                if not prompt:
                    await websocket.send_text(json.dumps({"error": "请输入有效的消息"}))
                    continue
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "无效的JSON格式"}))
                continue
            
            # 不需要将用户消息回传给客户端，前端已经在发送时添加了该消息
            
            # 生成回复
            reply = f"Echo: {prompt}"  # 默认回复
            
            # 尝试使用ModelScope API
            ms_api_key = os.getenv("MODELSCOPE_API_KEY", "")
            if ms_api_key:
                logger.info("WebSocket: 使用基于LangChain的多Agent系统处理请求")
                try:
                    # 使用多Agent工作流生成回复（异步生成器）
                    final_reply = None
                    async for step in global_workflow.run(prompt):
                        step_content = step["content"]
                        is_final = step["is_final"]
                        logger.info(f"WebSocket: 多Agent系统生成回复步骤: {step_content[:50]}...")
                        
                        # 保存最终回复（最后一个步骤）
                        if is_final:
                            final_reply = step_content
                        
                        # 发送回复步骤，添加loading标志（如果不是最终回复）
                        assistant_message = {
                            "id": str(os.urandom(8).hex()), 
                            "role": "assistant", 
                            "content": step_content,
                            "loading": not is_final  # 如果不是最终回复，则显示loading
                        }
                        await websocket.send_text(json.dumps(assistant_message))
                        
                        # 简单的延迟，模拟真实思考过程
                        import asyncio
                        await asyncio.sleep(1)
                    
                    # 保存最终回复到数据库
                    if final_reply:
                        save_message(prompt, final_reply)
                        logger.info(f"WebSocket: 保存最终回复到数据库成功")
                    
                    continue  # 已经发送了所有回复步骤，跳过默认回复
                except Exception as e:
                    logger.error(f"WebSocket: 多Agent系统调用失败: {str(e)}")
            
            # 保存对话记录（默认情况）
            save_message(prompt, reply)
            
            # 发送默认助手回复
            assistant_message = {"id": str(os.urandom(8).hex()), "role": "assistant", "content": reply}
            await websocket.send_text(json.dumps(assistant_message))
            
    except WebSocketDisconnect:
        logger.info("WebSocket连接已关闭")
    except Exception as e:
        logger.error(f"WebSocket连接发生错误: {str(e)}")
        await websocket.close(code=1011, reason=str(e))