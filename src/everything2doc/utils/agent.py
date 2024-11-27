from utils.ai_chat_client import ai_chat
from memory_manager import ConversationManager



# 一个agent需要哪些属性，
#  对它的描述、
# 它需要读入什么？  最终会输出什么？
# 它如何工作？ 基于提示词（system、chat）、模型、最大token数
# 工作中需要调用工具怎么办？ 提示词中写明工具，搞一个统一的工具调用接口
# 它有自己的memeory，更像一个独立的AI个体

class Agent:

    def __init__(self, 
                 description: str = "a worker that can do tasks",
                 system_prompt: str = "You are a worker that can do tasks",
                 chat_prompt: str = "You are a worker that can do tasks",
                 model: str = "gpt-4-mini",
                 max_tokens: int = 2000,
                 ):
        self.description = description
        self.system_prompt = system_prompt
        self.chat_prompt = chat_prompt
        self.model = model
        self.max_tokens = max_tokens
        
        self.memory = ConversationManager(
            max_tokens=max_tokens,
            model=model,
            system_prompt=system_prompt
        )
    


    def run(self, task_info: str):
        self.memory.add_message("user", task_info)
        messages = self.memory.get_context()
        result = ai_chat(message=messages, model=self.model)
        self.memory.add_message("assistant", result)
        return result