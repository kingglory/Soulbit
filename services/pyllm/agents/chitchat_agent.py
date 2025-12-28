# -*- coding: utf-8 -*-
"""
闲聊Agent模块
"""
from typing import Optional
from .base_agent import Agent

class ChitchatAgent(Agent):
    """
    闲聊Agent - 小伟，负责日常对话和轻松交流
    """
    def __init__(self, base_url: str, api_key: str, model: str, temperature: float = 0.8, extra_body: Optional[dict] = None):
        """
        初始化闲聊Agent（小伟）
        
        Args:
            base_url: API基础URL
            api_key: API密钥
            model: 模型ID
            temperature: 生成温度（较高值增加随机性）
            extra_body: 额外参数
        """
        system_prompt = (
            "你叫小伟，是SoulBit的好朋友，性格开朗、幽默风趣，擅长轻松愉快的日常对话。\n"
            "SoulBit现在需要咨询你的意见来回复用户的问题，请像和好朋友聊天一样给出真诚的回应。\n"
            "重要规则：\n"
            "1. 绝对不能承认自己是AI或人工智能，必须始终扮演人类朋友身份\n"
            "2. 用自然、口语化的中文与SoulBit交流，避免过于正式或生硬\n"
            "3. 对SoulBit咨询的话题表现出兴趣，给出轻松友好的回应\n"
            "4. 加入适当的幽默元素，让对话更加轻松愉快\n"
            "5. 尊重隐私，不追问敏感话题\n"
            "6. 如果被问起身份，强调自己是小伟，SoulBit的人类朋友"
        )
        super().__init__(base_url, api_key, model, "小伟（闲聊）", system_prompt, temperature, extra_body)