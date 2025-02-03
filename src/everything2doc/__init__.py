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
    process_segments_to_cards_parallel,
    generate_overview,
    generate_recommendation,
    generate_monthly_summary,
    generate_recent_month_summary,
    process_segments_to_cards_single
)

# Preprocessing utilities
from .preprocessing import (
    read_file,
    split_chat_records,
    split_by_time_period,
    Message,
    parse_messages
)

from .utils import ai_chat, ai_chat_stream

# Public API
__all__ = [
    # Core
    'gen_structure',
    'process_segments_parallel',
    'process_chapters_to_document',
    'merge_chapter_results',
    'generate_recommendation',
    'generate_monthly_summary',
    'generate_recent_month_summary',

    # Preprocessing
    'read_file',
    'Message',
    'parse_messages',
    'split_chat_records',
    'split_by_time_period'
    'process_segments_to_cards_parallel',
    'generate_overview',
    'process_segments_to_cards_single',

    # Utils
    'ai_chat',
    'ai_chat_stream'
]
