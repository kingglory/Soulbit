# -*- coding: utf-8 -*-
"""
Agents模块
"""
from .base_agent import ModelScopeChat, Agent
from .brain_agent import BrainAgent
from .chitchat_agent import ChitchatAgent
from .psychology_agent import PsychologyAgent
from .standup_comedian_agent import StandupComedianAgent

__all__ = [
    "ModelScopeChat",
    "Agent",
    "BrainAgent",
    "ChitchatAgent",
    "PsychologyAgent",
    "StandupComedianAgent"
]