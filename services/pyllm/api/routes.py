# -*- coding: utf-8 -*-
"""
API路由模块
"""
import os
from fastapi import FastAPI
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
            generated_reply = await global_workflow.run(prompt)
            if generated_reply:
                reply = generated_reply
                logger.info(f"多Agent系统生成回复成功: {reply}")
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