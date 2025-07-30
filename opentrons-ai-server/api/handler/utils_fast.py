import re
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException, UploadFile, status

from api.services.file_processor import FileProcessor


def parse_tagged_content(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    def extract_tag_content(tag_name: str, text: str) -> Optional[str]:
        """Extract content between opening and closing tags."""
        pattern = f"<{tag_name}>(.*?)</{tag_name}>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            content = match.group(1).strip()
            return content if content else None
        return None

    # Extract content from each tag
    thinking_content = extract_tag_content("THINKING", text)
    pd_json_content = extract_tag_content("PD_JSON", text)
    comments_content = extract_tag_content("COMMENTS", text)

    return thinking_content, pd_json_content, comments_content


def extract_message_index_from_filename(filename: str) -> tuple[int, str]:
    """
    Raw upload phase: Parses msgN_filename format to determine conversation placement.
    Returns (message_index, original_filename) for proper file grouping.
    """
    if filename.startswith("msg") and "_" in filename:
        parts = filename.split("_", 1)
        if len(parts) == 2 and parts[0][3:].isdigit():
            return int(parts[0][3:]), parts[1]

    return -1, filename  # Default for current message


def enhance_message_with_file_content(msg: Dict[str, Any], message_files: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Post-upload phase: Merges frontend attachment metadata with processed file content.
    Bridges frontend JSON (metadata only) with backend processed files before AI model.
    """
    enhanced_msg = msg.copy()
    file_content_map = {f["filename"]: f for f in message_files}

    if enhanced_msg.get("attachments"):
        # Message has attachment metadata - enhance with content
        enhanced_attachments = []
        for att in enhanced_msg["attachments"]:
            filename = att.get("name", att.get("filename", ""))
            if filename in file_content_map:
                file_ref = file_content_map[filename]
                enhanced_attachments.append(
                    {
                        "id": att.get("id", file_ref["id"]),
                        "filename": filename,
                        "file_type": file_ref["file_type"],
                        "content": file_ref["content"],
                        "media_type": file_ref["media_type"],
                    }
                )
        enhanced_msg["attachments"] = enhanced_attachments
    else:
        # No metadata - use files directly
        enhanced_msg["attachments"] = []
        for file_ref in message_files:
            enhanced_msg["attachments"].append(
                {
                    "id": file_ref["id"],
                    "filename": file_ref["filename"],
                    "file_type": file_ref["file_type"],
                    "content": file_ref["content"],
                    "media_type": file_ref["media_type"],
                }
            )

    return enhanced_msg


def reconstruct_conversation_history(
    parsed_history: List[Dict[str, Any]], files_by_message: Dict[int, List[Dict[str, str]]]
) -> List[Dict[str, Any]]:
    """
    Pre-AI phase: Final assembly of conversation history with files in correct message positions.
    Ensures AI model sees files in their original conversational context.
    """
    enhanced_history = []

    for i, msg in enumerate(parsed_history):
        if i in files_by_message and files_by_message[i]:
            enhanced_msg = enhance_message_with_file_content(msg, files_by_message[i])
        else:
            enhanced_msg = msg.copy()
        enhanced_history.append(enhanced_msg)

    return enhanced_history


async def process_single_multipart_file(file: UploadFile, message_index: int, file_count: int) -> Dict[str, str]:
    """
    Raw upload processing: Validates and processes single file for AI consumption.
    Sits between HTTP multipart parsing and conversation reconstruction.
    """
    file_content = await file.read()

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File has no filename")

    if not file.content_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File {file.filename} has no content type")

    processed = FileProcessor.process_multipart_file(file.filename, file.content_type, file_content)

    return {
        "id": f"upload_{message_index}_{file_count}",
        "filename": file.filename,
        "file_type": processed["file_type"],
        "content": processed["content"],
        "media_type": processed["media_type"],
    }
