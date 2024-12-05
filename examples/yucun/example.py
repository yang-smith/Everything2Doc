import os
from everything2doc import (
    gen_structure,
    split_chat_records,
    process_segments_parallel,
    process_chapters_to_document,
    merge_chapter_results,
    read_file
)

def generate_community_guide(input_file: str, output_file: str = 'output/final_document.md', user_input = "将聊天记录转为一份社区生活指南"):
    """
    Generate a community guide document from chat records
    
    Args:
        input_file: Path to input chat records file
        output_file: Path to output markdown file
    """
    try:
        input_file = os.path.abspath(input_file)
        
        try:
            chat_text = read_file(input_file)
        except (FileNotFoundError, IOError) as e:
            print(f"Failed to read input file: {str(e)}")
            raise

        print(f"Successfully read file: {input_file}")
        print(f"Content length: {len(chat_text)} characters")
        
        # Split into segments
        segments = split_chat_records(
            chat_text, 
            max_messages=1300, 
            min_messages=1000, 
            time_gap_minutes=100
        )
        
        if not segments:
            raise ValueError("No chat segments found")
            
        

        # Generate document structure
        doc_structure, outline = gen_structure(user_input, segments[0], model="anthropic/claude-3.5-sonnet:beta")
    
        # Process segments
        all_results = process_segments_parallel(segments, outline)

        # Merge results
        merged_result = merge_chapter_results(all_results)
        print("Merged results:", merged_result)

        # Generate final document
        cleaned_document = process_chapters_to_document(merged_result, doc_structure)

        # Save output
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(cleaned_document)
        
        print(f"Document saved to: {output_file}")
        
    except Exception as e:
        print(f"Error generating document: {str(e)}")
        raise

if __name__ == '__main__':
    try:
        generate_community_guide("./examples/ToAnotherCountry/ToAnotherCountry.txt")
    except Exception as e:
        print(f"Failed to process file: {str(e)}")