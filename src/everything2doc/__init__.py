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
    merge_chapter_results
)

# Preprocessing utilities
from .preprocessing import (
    read_file,
    split_chat_records
)

# Public API
__all__ = [
    # Core
    'gen_structure',
    'process_segments_parallel',
    'process_chapters_to_document',
    'merge_chapter_results',
    
    # Preprocessing
    'read_file',
    'split_chat_records',
]
