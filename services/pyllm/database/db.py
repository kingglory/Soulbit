# -*- coding: utf-8 -*-
"""
数据库操作模块
"""
import os
import sqlite3
from typing import Optional
from ..utils.logger import logger

# 数据库路径设置
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "app.db")

# 确保数据目录存在
os.makedirs(os.path.dirname(db_path), exist_ok=True)

def init_db():
    """
    初始化SQLite数据库，创建messages表（如果不存在）
    """
    logger.info(f"开始初始化数据库，数据库路径: {db_path}")
    try:
        # 连接数据库
        conn = sqlite3.connect(db_path)
        logger.info("数据库连接成功")
        
        c = conn.cursor()  # 创建游标
        # 创建messages表（如果不存在）
        create_table_sql = "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, prompt TEXT NOT NULL, reply TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
        logger.info(f"执行创建表SQL: {create_table_sql}")
        c.execute(create_table_sql)
        
        conn.commit()  # 提交事务
        logger.info("数据库表创建成功")
        
        conn.close()  # 关闭连接
        logger.info("数据库初始化完成")
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        raise

def save_message(prompt: str, reply: str) -> Optional[int]:
    """
    保存对话记录到数据库
    
    Args:
        prompt: 用户输入的提示词
        reply: LLM的回复内容
    
    Returns:
        保存的记录ID，如果保存失败则返回None
    """
    logger.info("准备保存对话记录到数据库")
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("INSERT INTO messages (prompt, reply) VALUES (?, ?)", (prompt, reply))
        conn.commit()
        message_id = c.lastrowid
        conn.close()
        logger.info(f"对话记录保存成功，ID: {message_id}")
        return message_id
    except Exception as e:
        logger.error(f"保存对话记录失败: {str(e)}")
        return None

# 执行数据库初始化
logger.info("准备执行数据库初始化")
init_db()