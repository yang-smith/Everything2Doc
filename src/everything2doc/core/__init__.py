"""Core functionality for document generation."""

from .gen_structure import gen_structure
from .worker import (
    process_segments_parallel,
    process_chapters_to_document, 
    merge_chapter_results,
    process_segments_to_cards_parallel,
    generate_overview,
    generate_recommendation,
    process_segments_to_cards_single,
    generate_monthly_summary,
    generate_recent_month_summary,
    generate_doc
)

__all__ = [
    'gen_structure',
    'process_segments_parallel',
    'process_chapters_to_document',
    'merge_chapter_results',
    'process_segments_to_cards_parallel',
    'generate_overview',
    'generate_recommendation',
    'process_segments_to_cards_single',
    'generate_monthly_summary',
    'generate_doc',
    'generate_recent_month_summary'
]
