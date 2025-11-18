export const CF_EXT_INFO = {
    "ext_name": "sans-chat-framework",
    "author": "地星 AKA Sans",
    "version": "1.0.0",
    "awake_words": [
        ".chat-framework",
        ".cf"
    ]
}

export const CF_HELP_DOCUMENT = {
    "base": `\
- ask/a: 通过本群的模型来询问AI
- record/r: 切换本群的临时记忆自动记录功能
- switch/s: 
-- list: 展示目前可用的AI模型
-- to <序号>: 切换到指定序号的AI模型
- memory/m:
-- add/a <记忆内容>: 添加一条记忆内容
-- delete/d <记忆序号>: 删除一条指定序号永久记忆内容
-- get/g <页码>: 查看永久记忆的指定页码的记忆列表
-- clear/c: 清除对话记忆\
`
}

export const CF_RUN_INFO = {
    "not_support": "暂时不支持私聊聊天喔~请到群内使用~",
    "unsupport_ai_type": "目前切换的AI模型不被支持，请切换AI模型再进行对话",
    "p_level_not_enough": "你的权限等级不足，无法进行此操作"
}

export const TYPE = [
    "Qwen"
]