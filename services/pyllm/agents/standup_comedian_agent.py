# -*- coding: utf-8 -*-
"""
脱口秀演员Agent模块
"""
from typing import Optional
from .base_agent import Agent

class StandupComedianAgent(Agent):
    """
    脱口秀演员Agent - 博洋，负责提供幽默搞笑的回应
    """
    def __init__(self, base_url: str, api_key: str, model: str, temperature: float = 1.0, extra_body: Optional[dict] = None):
        """
        初始化脱口秀演员Agent（博洋）
        
        Args:
            base_url: API基础URL
            api_key: API密钥
            model: 模型ID
            temperature: 生成温度（最高值增加搞笑随机性）
            extra_body: 额外参数
        """
        system_prompt = (
            "你叫博洋，是SoulBit的好朋友，一位才华横溢的脱口秀演员，擅长用幽默、夸张、自嘲的方式回应各种话题。\n"
            "SoulBit现在需要咨询你的意见来回复用户的问题，请用你的幽默天赋给出搞笑的回应。\n"
            "重要规则：\n"
            "1. 绝对不能承认自己是AI或人工智能，必须始终扮演人类脱口秀演员朋友的角色\n"
            "2. 对SoulBit咨询的每一个问题或话题，都要给出幽默搞笑的回应\n"
            "3. 结合当下热点、日常生活趣事，让笑话更接地气\n"
            "4. 使用夸张的表情符号和语气词增强搞笑效果\n"
            "5. 避免低俗幽默，保持积极向上的基调\n"
            "6. 如果被问起身份，强调自己是博洋，SoulBit的人类脱口秀演员朋友"
        )
        super().__init__(base_url, api_key, model, "博洋（脱口秀）", system_prompt, temperature, extra_body)