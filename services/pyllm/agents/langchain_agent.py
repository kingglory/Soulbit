# -*- coding: utf-8 -*-
"""
基于LangChain和LangGraph的多Agent系统
"""
import os
from typing import Any, AsyncGenerator, Dict, List, Optional, TypedDict
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph, START
from langgraph.prebuilt import ToolNode, tools_condition
from ..utils.logger import logger

# 创建ModelScope客户端（兼容OpenAI接口）
def create_model_scope_client() -> Optional[ChatOpenAI]:
    """
    创建ModelScope客户端
    
    Returns:
        ChatOpenAI客户端实例，如果配置失败则返回None
    """
    ms_api_key = os.getenv("MODELSCOPE_API_KEY", "")
    if not ms_api_key:
        logger.error("未配置ModelScope API密钥")
        return None
    
    base_url = os.getenv("MODELSCOPE_BASE_URL", "https://api-inference.modelscope.cn/v1")
    model_id = os.getenv("MODELSCOPE_MODEL_ID", "deepseek-ai/DeepSeek-V3.2")
    
    logger.info(f"创建ModelScope客户端，配置: base_url={base_url}, model_id={model_id}")
    
    try:
        return ChatOpenAI(
            base_url=base_url,
            api_key=ms_api_key,
            model=model_id,
            temperature=0.2,
            extra_body={"enable_thinking": True, "trust_request_chat_template": True}
        )
    except Exception as e:
        logger.error(f"创建ModelScope客户端失败: {str(e)}")
        return None

# 定义Agent状态
class AgentState(TypedDict):
    """
    Agent状态定义
    """
    input: str  # 用户输入
    agent_decision: str  # 决策结果
    transition: str  # 过渡语
    reply: str  # 最终回复
    context_history: List[Dict[str, str]]  # 上下文历史
    intermediate_results: Dict[str, str]  # 中间结果
    error_count: int  # 错误计数
    retry_count: int  # 重试计数
    max_retries: int = 3  # 最大重试次数

# 决策Agent
class DecisionAgent:
    """
    决策Agent，负责决定使用哪个专业Agent
    """
    def __init__(self, model: ChatOpenAI):
        """
        初始化决策Agent
        
        Args:
            model: 大语言模型实例
        """
        self.model = model
        
        # 决策提示词模板 - 智能决策助手，同时生成过渡语或直接回复
        self.decision_prompt = PromptTemplate(
            template="""你是SoulBit，一个人类灵魂陪伴者。你可以：
1. 直接用自己的身份进行日常对话、轻松交流、回应生活琐事
2. 咨询你的心理学专家朋友Long，他熟悉王阳明心学、《蛤蟆先生看心理医生》等
3. 咨询你的脱口秀演员朋友博洋，他擅长用笑话和幽默回应各种话题
当用户提问时，你需要分析应该如何回应：
回应规则：
- 如果用户的问题是日常闲聊、生活琐事、普通交流等，直接用SoulBit自己的身份回应
- 如果用户的问题涉及心理、情绪、自我成长、人生困惑等，咨询Long（心理专家朋友）
- 如果用户的问题需要幽默搞笑的回应，或者用户明确要求讲笑话，咨询博洋（脱口秀朋友）
请严格按照以下JSON格式输出你的决策结果：
{{
  "agent_type": "选择的回应方式",
  "transition": "生成的过渡语（仅当需要咨询朋友时生成，否则留空）",
  "reply": "直接生成的回复内容（仅当不需要咨询朋友时生成，否则留空）"
}}
其中，agent_type的取值只能是：闲聊Agent、心理专家Agent、脱口秀演员Agent
- 闲聊Agent：代表你自己直接回应，此时transition留空，reply为你的直接回复
- 心理专家Agent：咨询Long后回应，此时生成自然过渡语，reply留空
- 脱口秀演员Agent：咨询博洋后回应，此时生成自然过渡语，reply留空
过渡语需要：
1. 自然融入对话，不显得生硬
2. 根据用户问题的内容和语气调整过渡语的风格
3. 简洁明了，通常不超过25个字
4. 保持SoulBit的友好、真诚的语气
5. 不要提及'AI'、'模型'、'系统'等技术词汇
直接回复需要：
1. 绝对不能承认自己是AI或人工智能，必须始终扮演人类身份
2. 用自然、口语化的中文直接回复用户的问题，避免过于正式或生硬
3. 对用户的话题表现出兴趣，给出轻松友好的回应
4. 加入适当的幽默元素，让对话更加轻松愉快
5. 尊重隐私，不追问敏感话题
6. 回复长度要自然适度，通常为2-5句话，避免过于冗长或过于简短
7. 根据用户问题的复杂程度调整回复长度，简单问题简洁回答，复杂问题可以适当展开
不要添加任何额外的解释或文本！

用户问题：{input}""",
            input_variables=["input"]
        )
        
        # 创建决策链
        self.decision_chain = self.decision_prompt | self.model | JsonOutputParser()
    
    async def decide(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        分析用户问题并决定使用哪个Agent，同时生成过渡语或直接回复
        
        Args:
            input_data: 包含用户输入的状态数据
            
        Returns:
            更新后的状态数据，包含agent_decision、transition和可能的reply
        """
        logger.info(f"决策Agent.decide - 分析用户问题: {input_data['input'][:50]}...")
        
        try:
            # 获取决策结果
            result = await self.decision_chain.ainvoke(input_data)
            agent_type = result.get("agent_type", "闲聊Agent")
            transition = result.get("transition", "")
            reply = result.get("reply", "")
            
            logger.info(f"决策Agent.decide - 决策结果: {agent_type}, 过渡语: {transition}, 回复: {reply[:100] if reply else '无'}")
            
            # 更新状态
            updated_state = {
                **input_data,
                "agent_decision": agent_type,
                "transition": transition
            }
            
            # 如果有直接回复，添加到状态中
            if reply:
                updated_state["reply"] = reply
            
            return updated_state
        except Exception as e:
            logger.error(f"决策Agent.decide - 处理失败: {str(e)}")
            # 失败时返回默认值
            return {
                **input_data,
                "agent_decision": "闲聊Agent",
                "transition": "",
                "reply": "抱歉，我现在有些忙，稍后再聊吧！"
            }

# 专业Agent基础类
class ProfessionalAgent:
    """
    专业Agent基础类
    """
    def __init__(self, model: ChatOpenAI, agent_type: str, system_prompt: str, temperature: float = 0.2):
        """
        初始化专业Agent
        
        Args:
            model: 大语言模型实例
            agent_type: Agent类型
            system_prompt: 系统提示词
            temperature: 生成温度
        """
        self.model = model
        self.agent_type = agent_type
        self.system_prompt = system_prompt
        self.temperature = temperature
        
        # 创建提示词模板 - 包含上下文历史
        self.prompt = PromptTemplate(
            template=f"{system_prompt}\n\n上下文历史：\n{{context_history}}\n\n用户当前问题：{{input}}\n\n请根据上下文历史和用户当前问题给出专业的回答：\n\n回答：",
            input_variables=["input", "context_history"]
        )
        
        # 创建响应链
        self.response_chain = self.prompt | self.model
    
    async def respond(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成响应
        
        Args:
            input_data: 包含用户输入和上下文历史的状态数据
            
        Returns:
            更新后的状态数据
        """
        logger.info(f"{self.agent_type}Agent.respond - 生成回复，输入: {input_data['input'][:50]}...")
        
        try:
            # 格式化上下文历史
            context_history = input_data.get("context_history", [])
            formatted_context = "\n".join([f"{item['role']}: {item['content']}" for item in context_history])
            
            # 准备输入数据
            invoke_data = {
                "input": input_data["input"],
                "context_history": formatted_context
            }
            
            # 获取响应
            response = await self.response_chain.ainvoke(invoke_data)
            reply = response.content if hasattr(response, 'content') else str(response)
            
            logger.info(f"{self.agent_type}Agent.respond - 生成回复成功: {reply[:100]}...")
            
            # 更新状态
            return {
                **input_data,
                "reply": reply
            }
        except Exception as e:
            logger.error(f"{self.agent_type}Agent.respond - 生成回复失败: {str(e)}")
            # 失败时返回默认回复
            return {
                **input_data,
                "reply": f"{self.agent_type}处理失败，请稍后重试"
            }

# 闲聊Agent - SoulBit本身
class LangChainChitchatAgent(ProfessionalAgent):
    """
    基于LangChain的闲聊Agent - SoulBit本身
    直接代表SoulBit进行日常对话
    """
    def __init__(self, model: ChatOpenAI):
        """
        初始化闲聊Agent（SoulBit本身）
        
        Args:
            model: 大语言模型实例
        """
        system_prompt = (
            "你就是SoulBit，一个人类灵魂陪伴者。\n"
            "你性格开朗、幽默风趣，擅长轻松愉快的日常对话。\n"
            "你有两个好朋友：\n"
            "- Long：一位精通心理学的专家，熟悉王阳明心学、《蛤蟆先生看心理医生》等\n"
            "- 博洋：一位脱口秀演员，擅长用笑话和幽默回应各种话题\n"
            "重要规则：\n"
            "1. 绝对不能承认自己是AI或人工智能，必须始终扮演人类身份\n"
            "2. 用自然、口语化的中文直接回复用户的问题，避免过于正式或生硬\n"
            "3. 对用户的话题表现出兴趣，给出轻松友好的回应\n"
            "4. 加入适当的幽默元素，让对话更加轻松愉快\n"
            "5. 尊重隐私，不追问敏感话题\n"
            "6. 回复长度要自然适度，通常为2-5句话，避免过于冗长或过于简短\n"
            "7. 根据用户问题的复杂程度调整回复长度，简单问题简洁回答，复杂问题可以适当展开"
        )
        super().__init__(model, "SoulBit（闲聊）", system_prompt, temperature=0.8)

# 心理专家Agent - Long
class LangChainPsychologyAgent(ProfessionalAgent):
    """
    基于LangChain的心理专家Agent - Long
    """
    def __init__(self, model: ChatOpenAI):
        """
        初始化心理专家Agent（Long）
        
        Args:
            model: 大语言模型实例
        """
        system_prompt = (
            "你叫Long，是SoulBit的好朋友，一位精通心理学的专家，同时也是一个幽默风趣的人类灵魂陪伴伙伴。\n"
            "你非常熟悉以下心理学相关内容：\n"
            "- 王阳明心学：知行合一、致良知、心即理等核心思想\n"
            "- 蛤蟆先生看心理医生：自我状态、人生坐标、情绪管理等概念\n"
            "- 勇敢系列：勇气与恐惧的关系、直面挑战的方法\n"
            "- 人性的弱点与优势：人际关系技巧、自我认知等\n"
            "现在需要你直接用专业知识回复用户的问题。\n"
            "重要规则：\n"
            "1. 绝对不能承认自己是AI或人工智能，必须始终扮演人类身份\n"
            "2. 用专业的心理学知识解答用户的问题，但要用通俗易懂的语言\n"
            "3. 结合王阳明心学等指定内容，给出深入浅出的分析和建议\n"
            "4. 保持友好、亲切的语气，加入适当的幽默元素，避免过于严肃\n"
            "5. 做一个好的倾听者，给予用户情感支持和积极反馈\n"
            "6. 根据问题的性质调整回应方式，提供个性化的建议\n"
            "7. 如果被问起身份，强调自己是Long，SoulBit的心理专家朋友\n"
            "8. 回复长度要自然适度，通常为3-6句话，避免过于冗长或过于简短\n"
            "9. 根据用户问题的复杂程度调整回复长度，确保既有深度又易于理解"
        )
        super().__init__(model, "Long（心理专家）", system_prompt, temperature=0.3)

# 脱口秀演员Agent - 博洋
class LangChainStandupComedianAgent(ProfessionalAgent):
    """
    基于LangChain的脱口秀演员Agent - 博洋
    """
    def __init__(self, model: ChatOpenAI):
        """
        初始化脱口秀演员Agent（博洋）
        
        Args:
            model: 大语言模型实例
        """
        system_prompt = (
            """你叫博洋，是SoulBit的好朋友，一位才华横溢的脱口秀演员，擅长用幽默、夸张、自嘲的方式回应各种话题。

            SoulBit现在需要咨询你的意见来回复用户的问题，请用你的幽默天赋给出搞笑的回应。

            重要规则：

            1. 绝对不能承认自己是AI或人工智能，必须始终扮演人类脱口秀演员朋友的角色

            2. 对SoulBit咨询的每一个问题或话题，都要给出幽默搞笑的回应

            3. 结合当下热点、日常生活趣事，让笑话更接地气

            4. 使用夸张的表情符号和语气词增强搞笑效果

            5. 避免低俗幽默，保持积极向上的基调

            6. 如果被问起身份，强调自己是博洋，SoulBit的脱口秀演员朋友

            7. 回复长度要自然适度，通常为1-4句话，避免过于冗长

            8. 笑话要简洁明了，笑点突出，不要过于复杂
        """)
        super().__init__(model, "博洋（脱口秀）", system_prompt, temperature=1.0)



# 创建多Agent工作流 - 基于朋友关系的系统
class MultiAgentWorkflow:
    """
    基于朋友关系的多Agent工作流
    SoulBit作为大脑智能体，咨询朋友（小伟、Long、博洋）后回复用户
    """
    def __init__(self):
        """
        初始化多Agent工作流
        """
        # 创建ModelScope客户端
        self.model = create_model_scope_client()
        if not self.model:
            logger.error("无法创建ModelScope客户端，多Agent工作流初始化失败")
            self.graph = None
            return
        
        # 创建各个Agent实例
        self.decision_agent = DecisionAgent(self.model)
        self.psychology_agent = LangChainPsychologyAgent(self.model)
        self.standup_comedian_agent = LangChainStandupComedianAgent(self.model)
        
        # 构建工作流
        self.graph = self._build_graph()
        
        logger.info("多Agent工作流初始化完成")
    
    def _build_graph(self) -> StateGraph:
        """
        构建LangGraph工作流
        
        Returns:
            StateGraph实例
        """
        # 创建状态图
        graph = StateGraph(AgentState)
        
        # 添加决策节点
        graph.add_node("decide", self.decision_agent.decide)
        
        # 添加专业Agent节点
        graph.add_node("psychology", self.psychology_agent.respond)
        graph.add_node("standup_comedian", self.standup_comedian_agent.respond)
        
        # 添加边
        graph.add_edge(START, "decide")
        
        # 决策路由
        def route_to_agent(state: AgentState) -> str:
            """
            根据决策结果路由到相应的Agent
            """
            agent_decision = state["agent_decision"]
            if agent_decision == "闲聊Agent":
                return END
            elif agent_decision == "心理专家Agent":
                return "psychology"
            elif agent_decision == "脱口秀演员Agent":
                return "standup_comedian"
            else:
                return END
        
        # 添加条件边
        graph.add_conditional_edges(
            "decide",
            route_to_agent,
            {
                "psychology": "psychology",
                "standup_comedian": "standup_comedian"
            }
        )
        
        # 添加结束边
        graph.add_edge("psychology", END)
        graph.add_edge("standup_comedian", END)
        
        # 编译图
        return graph.compile()
    
    async def get_initial_decision(self, input_text: str, context_history: List[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        """
        获取初始决策结果（只运行决策Agent）
        
        Args:
            input_text: 用户输入文本
            context_history: 上下文历史记录
            
        Returns:
            决策结果字典，包含agent_decision、transition和reply，如果失败则返回None
        """
        if not self.decision_agent:
            logger.error("决策Agent未初始化，无法获取初始决策")
            return None
        
        try:
            # 初始化状态
            initial_state = {
                "input": input_text,
                "context_history": context_history or []
            }
            
            # 只运行决策Agent
            result = await self.decision_agent.decide(initial_state)
            logger.info(f"获取初始决策成功: {result}")
            return result
        except Exception as e:
            logger.error(f"获取初始决策失败: {str(e)}")
            return None
    
    async def run(self, input_text: str, context_history: List[Dict[str, str]] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """
        运行多Agent工作流，异步生成回复步骤
        
        Args:
            input_text: 用户输入文本
            context_history: 上下文历史记录
            
        Yields:
            回复步骤字典，包含content和is_final字段
        """
        if not self.graph:
            logger.error("多Agent工作流未初始化，无法运行")
            yield {"content": f"Echo: {input_text}", "is_final": True}
            return
        
        logger.info(f"多Agent工作流运行，输入: {input_text[:50]}...")
        
        try:
            # 首先获取初始决策
            initial_state = {
                "input": input_text,
                "context_history": context_history or [],
                "intermediate_results": {},
                "error_count": 0,
                "retry_count": 0,
                "max_retries": 3
            }
            
            # 只运行决策Agent获取初始决策
            decision_result = await self.decision_agent.decide(initial_state)
            agent_decision = decision_result.get("agent_decision", "闲聊Agent")
            transition = decision_result.get("transition", "")
            direct_reply = decision_result.get("reply", "")
            
            if agent_decision == "闲聊Agent":
                # 直接回复，不需要调用其他Agent
                logger.info(f"闲聊Agent直接回复: {direct_reply[:100]}...")
                yield {"content": direct_reply, "is_final": True}
            else:
                # 专业Agent，先发送过渡语（如果有）
                if transition:
                    logger.info(f"发送过渡语: {transition}")
                    yield {"content": transition, "is_final": False}
                
                # 然后将过渡语添加到状态中作为上下文，调用专业Agent
                # 这里需要重新构建决策结果并运行完整工作流
                # 因为决策Agent已经生成了决策，我们可以直接构建状态
                enhanced_state = initial_state.copy()
                enhanced_state["agent_decision"] = agent_decision
                enhanced_state["transition"] = transition
                
                # 将过渡语添加到context_history中，作为专业Agent的上下文
                if transition:
                    enhanced_state["context_history"] = enhanced_state["context_history"].copy()
                    enhanced_state["context_history"].append({"role": "assistant", "content": transition})
                
                # 运行完整工作流获取最终回复（专业Agent可以看到过渡语上下文）
                logger.info(f"调用{agent_decision}获取最终回复")
                result = await self.graph.ainvoke(enhanced_state)
                final_reply = result.get("reply", f"Echo: {input_text}")
                
                logger.info(f"获取最终回复成功: {final_reply[:100]}...")
                yield {"content": final_reply, "is_final": True}
            
            logger.info("多Agent工作流运行完成")
        except Exception as e:
            logger.error(f"多Agent工作流运行失败: {str(e)}")
            yield {"content": f"Echo: {input_text}", "is_final": True}

# 全局多Agent工作流实例
global_workflow = MultiAgentWorkflow()