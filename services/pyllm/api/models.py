# -*- coding: utf-8 -*-
"""
API数据模型模块
"""
from pydantic import BaseModel
from typing import Optional

class PromptIn(BaseModel):
    """
    接收用户输入的提示词模型
    """
    prompt: str  # 提示词字符串

class LLMOut(BaseModel):
    """
    LLM输出模型
    """
    reply: str  # 回复内容
    error: Optional[str] = None  # 错误信息（可选）

class AgentDecision(BaseModel):
    """
    Agent决策结果模型
    """
    agent_type: str

class ReplyModel(BaseModel):
    """
    结构化回复模型
    """
    reply: str