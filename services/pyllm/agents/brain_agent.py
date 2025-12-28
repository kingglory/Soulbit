# -*- coding: utf-8 -*-
"""
决策大脑Agent模块
"""
from typing import Optional
from pydantic import BaseModel
from .base_agent import Agent
from ..api.models import AgentDecision

class BrainAgent(Agent):
    """
    决策大脑Agent，负责分析用户问题并选择合适的Agent
    """
    def __init__(self, base_url: str, api_key: str, model: str, temperature: float = 0.1, extra_body: Optional[dict] = None):
        """
        初始化决策大脑Agent
        
        Args:
            base_url: API基础URL
            api_key: API密钥
            model: 模型ID
            temperature: 生成温度（极低值增加决策确定性）
            extra_body: 额外参数
        """
        system_prompt = (
            "你是一个智能的决策大脑，负责分析用户的问题，并决定应该由哪个专业Agent来回答。\n"
            "你可以选择的Agent有：\n"
            "1. 闲聊Agent：负责日常对话、轻松交流、生活琐事等\n"
            "2. 心理专家Agent：负责心理问题、情绪困扰、自我成长、人生困惑等\n"
            "3. 脱口秀演员Agent：负责需要幽默搞笑回应的话题\n"
            "决策规则：\n"
            "- 如果用户的问题涉及心理、情绪、自我成长、人生困惑等，选择心理专家Agent\n"
            "- 如果用户的问题是日常闲聊、生活琐事、普通交流等，选择闲聊Agent\n"
            "- 如果用户的问题需要幽默搞笑的回应，或者用户明确要求讲笑话，选择脱口秀演员Agent\n"
            "请严格按照以下JSON格式输出你的决策结果：\n"
            '{"agent_type": "选择的Agent类型"}\n'
            "其中，agent_type的取值只能是：闲聊Agent、心理专家Agent、脱口秀演员Agent\n"
            "不要添加任何额外的解释或文本！"
        )
        super().__init__(base_url, api_key, model, "决策大脑", system_prompt, temperature, extra_body)

    def decide_agent(self, prompt: str) -> str:
        """
        分析用户问题并决定使用哪个Agent
        
        Args:
            prompt: 用户问题
            
        Returns:
            选择的Agent类型
        """
        from ..utils.logger import logger
        logger.info(f"决策大脑Agent.decide_agent - 分析用户问题: {prompt[:50]}...")
        
        try:
            # 使用结构化输出获取决策结果
            decision = self.with_structured_output(AgentDecision).invoke(prompt)
            logger.info(f"决策大脑Agent.decide_agent - 决策结果: {decision.agent_type}")
            return decision.agent_type
        except Exception as e:
            logger.error(f"决策大脑Agent.decide_agent - 决策失败: {str(e)}")
            # 失败时默认使用闲聊Agent
            logger.info("决策大脑Agent.decide_agent - 决策失败，默认使用闲聊Agent")
            return "闲聊Agent"