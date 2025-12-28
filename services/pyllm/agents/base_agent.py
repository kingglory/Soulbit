# -*- coding: utf-8 -*-
"""
Agent基类模块
"""
import json
import re
from typing import Optional
from openai import OpenAI
from pydantic import BaseModel
from ..utils.logger import logger
from ..api.models import ReplyModel

class ModelScopeChat:
    """
    ModelScope API客户端，用于调用大语言模型
    """
    def __init__(self, base_url: str, api_key: str, model: str, temperature: float = 0.2, extra_body: Optional[dict] = None):
        """
        初始化客户端
        
        Args:
            base_url: API基础URL
            api_key: API密钥
            model: 模型ID
            temperature: 生成温度（控制随机性）
            extra_body: 额外参数
        """
        self.client = OpenAI(base_url=base_url, api_key=api_key)  # 创建OpenAI兼容客户端
        self.model = model  # 模型ID
        self.temperature = temperature  # 生成温度
        self.extra_body = extra_body or {}  # 额外参数
        # 系统提示词 - 默认设置
        self.system_prompt = ""
        logger.info(f"初始化ModelScopeChat客户端，模型: {self.model}")

    def invoke(self, prompt: str) -> str:
        """
        调用模型生成文本
        
        Args:
            prompt: 用户提示词
            
        Returns:
            模型生成的文本
        """
        logger.info(f"ModelScopeChat.invoke - 调用模型: {self.model}, 提示词: {prompt[:50]}...")
        try:
            # 构建包含系统提示词和用户提示词的对话历史
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            logger.info(f"ModelScopeChat.invoke - 完整对话: {messages}")
            
            resp = self.client.chat.completions.create(
                model=self.model,  # 指定模型
                messages=messages,  # 完整对话历史
                temperature=self.temperature,  # 生成温度
                stream=False,  # 不使用流式输出
                extra_body=self.extra_body,  # 额外参数
            )
            logger.info(f"ModelScopeChat.invoke - 模型调用成功")
            content = resp.choices[0].message.content or ""
            logger.info(f"ModelScopeChat.invoke - 生成内容: {content[:100]}...")
            return content  # 返回生成的内容
        except Exception as e:
            logger.error(f"ModelScopeChat.invoke - 模型调用失败: {str(e)}")
            raise

    def with_structured_output(self, pyd_model: type[BaseModel]):
        """
        配置模型输出结构化数据
        
        Args:
            pyd_model: Pydantic模型类
            
        Returns:
            包装器对象，具有invoke方法
        """
        class Wrapper:
            def __init__(self, outer: "ModelScopeChat"):
                self.outer = outer

            def invoke(self, prompt: str) -> BaseModel:
                # 获取Pydantic模型的JSON Schema
                schema = pyd_model.model_json_schema()
                props = schema.get("properties", {})
                required = schema.get("required", [])
                
                # 生成schema描述文本
                schema_text_lines = []
                for k, v in props.items():
                    t = v.get("type", "string")
                    schema_text_lines.append(f"- {k}: {t}")
                schema_text = "\n".join(schema_text_lines) or "-"
                required_text = ", ".join(required) if required else "所有字段"
                
                # 系统提示词，结合用户人设和JSON格式指导
                system_msg = (
                    f"{self.outer.system_prompt}\n"
                    "\n请严格按照以下格式输出JSON内容，不要添加任何额外解释或文本：\n"
                    f"{schema_text}\n"
                    f"必须包含字段：{required_text}\n"
                    "不要输出任何解释或多余文本。"
                )
                
                # 调用模型
                messages = [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt},
                ]
                resp = self.outer.client.chat.completions.create(
                    model=self.outer.model,
                    messages=messages,
                    temperature=self.outer.temperature,
                    stream=False,
                    extra_body=self.outer.extra_body,
                )
                
                # 处理响应
                content = (resp.choices[0].message.content or "").strip()
                
                # 提取JSON内容的辅助函数
                def extract_json(s: str) -> str:
                    m = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', s)
                    return m.group(1) if m else "{}"
                
                # 解析JSON
                try:
                    data = json.loads(content)
                except Exception:
                    data = json.loads(extract_json(content))  # 尝试提取JSON
                
                return pyd_model.model_validate(data)  # 验证并返回模型实例
        
        return Wrapper(self)

class Agent(ModelScopeChat):
    """
    Agent基类，继承自ModelScopeChat，提供更通用的Agent功能
    """
    def __init__(self, base_url: str, api_key: str, model: str, agent_type: str, system_prompt: str, temperature: float = 0.2, extra_body: Optional[dict] = None):
        """
        初始化Agent
        
        Args:
            base_url: API基础URL
            api_key: API密钥
            model: 模型ID
            agent_type: Agent类型
            system_prompt: Agent特定的系统提示词
            temperature: 生成温度
            extra_body: 额外参数
        """
        super().__init__(base_url, api_key, model, temperature, extra_body)
        self.agent_type = agent_type  # Agent类型
        self.system_prompt = system_prompt  # Agent特定的系统提示词
        logger.info(f"初始化{agent_type} Agent，系统提示词: {self.system_prompt[:100]}...")

    def invoke(self, prompt: str) -> str:
        """
        调用Agent生成文本
        
        Args:
            prompt: 用户提示词
            
        Returns:
            生成的文本
        """
        logger.info(f"{self.agent_type} Agent.invoke - 提示词: {prompt[:50]}...")
        return super().invoke(prompt)