"""
Everything2Doc
-------------
Convert chat records to structured documents using AI.
"""

__version__ = '0.1.0'

# Core functionality
from .core.gen_structure import gen_structure

from .core.worker import (
    process_segments_parallel,
    process_chapters_to_document,
    merge_chapter_results,
    process_segments_to_cards_parallel
)

# Preprocessing utilities
from .preprocessing import (
    read_file,
    split_chat_records,
    Message,
    parse_messages
)

from .utils import ai_chat

# Public API
__all__ = [
    # Core
    'gen_structure',
    'process_segments_parallel',
    'process_chapters_to_document',
    'merge_chapter_results',
    
    # Preprocessing
    'read_file',
    'Message',
    'parse_messages',
    'split_chat_records',
    'process_segments_to_cards_parallel',

    # Utils
    'ai_chat'
]
