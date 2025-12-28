# -*- coding: utf-8 -*-
"""
环境变量加载模块
"""
import os
from .logger import logger

def load_env():
    """
    加载.env文件中的环境变量
    """
    try:
        from dotenv import load_dotenv
        import os
        # 获取项目根目录
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        env_path = os.path.join(project_root, ".env")
        load_dotenv(dotenv_path=env_path)
        logger.info(f".env文件加载成功，路径: {env_path}")
    except ImportError:
        logger.warning("未安装python-dotenv库，无法加载.env文件")
        logger.info("请使用`pip install python-dotenv`安装dotenv库")
    except Exception as e:
        logger.error(f"加载.env文件失败: {str(e)}")

# 初始化时自动加载环境变量
load_env()