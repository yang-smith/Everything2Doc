import pytest
from unittest.mock import patch, MagicMock
import os
from everything2doc.core.core import gen_structure, merge_chapter_results
from everything2doc.preprocessing.split import split_chat_records
from everything2doc.prompt.prompt import PROMPT_GEN_STRUCTURE
from everything2doc.core.worker import process_segments_parallel, process_chapters_to_document
from everything2doc.core.utils import read_file

@pytest.fixture
def user_input():
    return ["将聊天记录转为一份社区生活指南", "将聊天记录转为一份常见问答文档"]

def test_update_doc(user_input):

    chat_text = read_file()

    segments = split_chat_records(chat_text, max_messages=1300, min_messages=1000, time_gap_minutes=100)
    
    chat_records = segments[0]

    result, task = gen_structure(user_input, chat_records)

    all_results = process_segments_parallel(segments, task)

    # 合并结果
    merged_result = merge_chapter_results(all_results)
    print(merged_result)

    # 处理章节并生成最终文档
    cleaned_document = process_chapters_to_document(merged_result, result)

    # 写入文件
    output_file = 'output/final_document.md'
    os.makedirs('output', exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_document)
    
    print(f"文档已保存到: {output_file}")