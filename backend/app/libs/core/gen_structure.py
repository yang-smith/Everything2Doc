import os
import re
from ..utils.ai_chat_client import ai_chat
from ..prompt.prompt import PROMPT_GEN_DOC_STRUCTURE


def gen_structure(user_input, chat_records, model="anthropic/claude-3.5-sonnet:beta", structure_file = 'output/document_structure.txt'):
    
    pattern = r'<outline>\s*(.*?)\s*</outline>'
    
    if os.path.exists(structure_file):
        with open(structure_file, 'r', encoding='utf-8') as f:
            result = f.read()
            match = re.search(pattern, result, re.DOTALL)
            outline = match.group(1).strip() if match else result
            return result, outline
    
    combined_input = PROMPT_GEN_DOC_STRUCTURE.format(user_input=user_input, chat_records=chat_records)

    result = ai_chat(message=combined_input, model=model)

    
    # os.makedirs('output', exist_ok=True)
    # with open(structure_file, 'w', encoding='utf-8') as f:
    #     f.write(result)
    #     f.write('\n')
    

    match = re.search(pattern, result, re.DOTALL)
    if match:
        outline = match.group(1).strip()
    else:
        outline = result
    return result, outline