# -*- coding: utf-8 -*-
"""
日志配置模块
"""
import logging

# 配置日志系统
logging.basicConfig(
    level=logging.INFO,  # 设置日志级别为INFO
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',  # 日志格式
    datefmt='%Y-%m-%d %H:%M:%S'  # 时间格式
)

# 创建全局日志记录器
logger = logging.getLogger(__name__)