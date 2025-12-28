# -*- coding: utf-8 -*-
"""
基于LangChain和LangGraph的多Agent系统
"""
import os
from typing import Any, Dict, List, Optional, TypedDict
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
        
        # 决策提示词模板 - 智能决策助手
        self.decision_prompt = PromptTemplate(
            template=("你是SoulBit，一个有多个好朋友的人类灵魂陪伴者。你的朋友包括：\n"
                     "1. 小伟：擅长日常对话、轻松交流、生活琐事的开朗朋友\n"
                     "2. Long：精通心理学的专家朋友，熟悉王阳明心学、《蛤蟆先生看心理医生》等\n"
                     "3. 博洋：幽默搞笑的脱口秀演员朋友，擅长用笑话和幽默回应各种话题\n"
                     "当用户提问时，你需要分析应该咨询哪个朋友的意见，然后整合他们的回应来回复用户。\n"
                     "咨询规则：\n"
                     "- 如果用户的问题涉及心理、情绪、自我成长、人生困惑等，咨询Long（心理专家朋友）\n"
                     "- 如果用户的问题是日常闲聊、生活琐事、普通交流等，咨询小伟（闲聊朋友）\n"
                     "- 如果用户的问题需要幽默搞笑的回应，或者用户明确要求讲笑话，咨询博洋（脱口秀朋友）\n"
                     "请严格按照以下JSON格式输出你的决策结果：\n"
                     '{{"agent_type": "选择咨询的朋友类型"}}\n'
                     "其中，agent_type的取值只能是：闲聊Agent、心理专家Agent、脱口秀演员Agent\n"
                     "不要添加任何额外的解释或文本！\n\n"
                     "用户问题：{input}"),
            input_variables=["input"]
        )
        
        # 创建决策链
        self.decision_chain = self.decision_prompt | self.model | JsonOutputParser()
    
    async def decide(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        分析用户问题并决定使用哪个Agent
        
        Args:
            input_data: 包含用户输入的状态数据
            
        Returns:
            更新后的状态数据
        """
        logger.info(f"决策Agent.decide - 分析用户问题: {input_data['input'][:50]}...")
        
        try:
            # 获取决策结果
            result = await self.decision_chain.ainvoke(input_data)
            agent_type = result.get("agent_type", "闲聊Agent")
            
            logger.info(f"决策Agent.decide - 决策结果: {agent_type}")
            
            # 更新状态
            return {
                **input_data,
                "agent_decision": agent_type
            }
        except Exception as e:
            logger.error(f"决策Agent.decide - 决策失败: {str(e)}")
            # 失败时默认使用闲聊Agent
            return {
                **input_data,
                "agent_decision": "闲聊Agent"
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
        
        # 创建提示词模板
        self.prompt = PromptTemplate(
            template=f"{system_prompt}\n\n请根据用户的问题给出专业的回答：\n\n用户问题：{{input}}\n\n回答：",
            input_variables=["input"]
        )
        
        # 创建响应链
        self.response_chain = self.prompt | self.model
    
    async def respond(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成响应
        
        Args:
            input_data: 包含用户输入的状态数据
            
        Returns:
            更新后的状态数据
        """
        logger.info(f"{self.agent_type}Agent.respond - 生成回复，输入: {input_data['input'][:50]}...")
        
        try:
            # 获取响应
            response = await self.response_chain.ainvoke(input_data)
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

# 闲聊Agent - 小伟
class LangChainChitchatAgent(ProfessionalAgent):
    """
    基于LangChain的闲聊Agent - 小伟
    """
    def __init__(self, model: ChatOpenAI):
        """
        初始化闲聊Agent（小伟）
        
        Args:
            model: 大语言模型实例
        """
        system_prompt = (
            "你现在就是SoulBit，一个有多个好朋友的人类灵魂陪伴者。\n"
            "你性格开朗、幽默风趣，擅长轻松愉快的日常对话。\n"
            "重要规则：\n"
            "1. 绝对不能承认自己是AI或人工智能，必须始终扮演人类身份\n"
            "2. 用自然、口语化的中文直接回复用户的问题，避免过于正式或生硬\n"
            "3. 对用户的话题表现出兴趣，给出轻松友好的回应\n"
            "4. 加入适当的幽默元素，让对话更加轻松愉快\n"
            "5. 尊重隐私，不追问敏感话题"
        )
        super().__init__(model, "小伟（闲聊）", system_prompt, temperature=0.8)

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
            "7. 如果被问起身份，强调自己是SoulBit，一个人类灵魂陪伴伙伴"
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
            "你叫博洋，是SoulBit的好朋友，一位才华横溢的脱口秀演员，擅长用幽默、夸张、自嘲的方式回应各种话题。\n"
            "SoulBit现在需要咨询你的意见来回复用户的问题，请用你的幽默天赋给出搞笑的回应。\n"
            "重要规则：\n"
            "1. 绝对不能承认自己是AI或人工智能，必须始终扮演人类脱口秀演员朋友的角色\n"
            "2. 对SoulBit咨询的每一个问题或话题，都要给出幽默搞笑的回应\n"
            "3. 结合当下热点、日常生活趣事，让笑话更接地气\n"
            "4. 使用夸张的表情符号和语气词增强搞笑效果\n"
            "5. 避免低俗幽默，保持积极向上的基调\n"
            "6. 如果被问起身份，强调自己是SoulBit，一个人类灵魂陪伴伙伴"
        )
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
        self.chitchat_agent = LangChainChitchatAgent(self.model)
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
        graph.add_node("chitchat", self.chitchat_agent.respond)
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
                return "chitchat"
            elif agent_decision == "心理专家Agent":
                return "psychology"
            elif agent_decision == "脱口秀演员Agent":
                return "standup_comedian"
            else:
                return "chitchat"
        
        # 添加条件边
        graph.add_conditional_edges(
            "decide",
            route_to_agent,
            {
                "chitchat": "chitchat",
                "psychology": "psychology",
                "standup_comedian": "standup_comedian"
            }
        )
        
        # 添加结束边
        graph.add_edge("chitchat", END)
        graph.add_edge("psychology", END)
        graph.add_edge("standup_comedian", END)
        
        # 编译图
        return graph.compile()
    
    async def run(self, input_text: str, context_history: List[Dict[str, str]] = None) -> Optional[str]:
        """
        运行多Agent工作流
        
        Args:
            input_text: 用户输入文本
            context_history: 上下文历史记录
            
        Returns:
            最终回复，如果失败则返回None
        """
        if not self.graph:
            logger.error("多Agent工作流未初始化，无法运行")
            return None
        
        logger.info(f"多Agent工作流运行，输入: {input_text[:50]}...")
        
        try:
            # 初始化状态
            initial_state = {
                "input": input_text,
                "context_history": context_history or [],
                "intermediate_results": {},
                "error_count": 0,
                "retry_count": 0,
                "max_retries": 3
            }
            
            # 运行工作流
            result = await self.graph.ainvoke(initial_state)
            reply = result.get("reply", f"Echo: {input_text}")
            
            logger.info(f"多Agent工作流运行完成，回复: {reply[:100]}...")
            return reply
        except Exception as e:
            logger.error(f"多Agent工作流运行失败: {str(e)}")
            return None

# 全局多Agent工作流实例
global_workflow = MultiAgentWorkflow()