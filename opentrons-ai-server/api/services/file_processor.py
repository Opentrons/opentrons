"""
File processor service for handling file content processing
Server handles all file processing
"""

import base64
import logging
from typing import Any, Dict, List, Literal, Optional, TypedDict

import anthropic
from api.constants.file_constants import CONTENT_TYPE_MAPPING, format_file_size_error, get_file_size_limit

logger = logging.getLogger(__name__)

# Type definitions
FileType = Literal["pdf", "csv", "python"]
MediaType = Literal["application/pdf", "text/csv", "text/x-python", "text/plain"]


class ProcessedFileResult(TypedDict):
    """Type definition for processed file results"""

    content: str  # Base64-encoded for PDFs, UTF-8 decoded text for CSV/Python files
    media_type: MediaType
    file_type: FileType


class FileProcessor:
    """Process raw file content from frontend into appropriate formats for Anthropic"""

    # Maximum total token count for all files combined
    # Anthropic has ~200K token limit, so this leaves room for conversation context
    MAX_TOTAL_TOKENS = 150000
    # Warning threshold at 80% of limit
    WARNING_TOTAL_TOKENS = int(MAX_TOTAL_TOKENS * 0.8)  # 120,000 tokens

    @staticmethod
    def _estimate_tokens(content: str, media_type: str) -> int:
        """
        Fallback token estimation when Anthropic API fails.

        Used as backup when count_file_tokens() encounters API errors during token validation.
        Provides rough estimates based on content length and media type characteristics.
        """
        if media_type == "application/pdf":
            # Base64 increases size by ~33%, PDF typically has ~8 chars per token
            # Add overhead for document block structure
            original_size = len(content) * 0.75
            return int(original_size / 8) + 100
        # Text content averages ~4 characters per token
        return len(content) // 4

    @staticmethod
    def count_file_tokens(
        filename: str, content: str, media_type: str, anthropic_client: anthropic.Anthropic, model: Optional[str] = None
    ) -> int:
        """
        Count tokens for a processed file using Anthropic API with fallback estimation.

        This is called during token validation phase, AFTER files have been processed into
        Anthropic-compatible format (base64 for PDFs, UTF-8 for text) but BEFORE sending
        the chat completion request. It provides accurate token counts for quota checking.

        Pipeline position: File Processing → Token Counting → Token Validation → Anthropic API
        """
        try:
            # Build message content based on media type
            message_content = [
                (
                    {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": content}}
                    if media_type == "application/pdf"
                    else {"type": "text", "text": content}
                )
            ]

            token_count_response = anthropic_client.messages.count_tokens(
                model=model or "claude-sonnet-5",
                messages=[{"role": "user", "content": message_content}],  # type: ignore
            )

            logger.info(f"File {filename} token count: {token_count_response.input_tokens}")
            return token_count_response.input_tokens

        except anthropic.APIError as e:
            logger.warning(f"Could not count tokens for file {filename} ({media_type}): {e}")
            return FileProcessor._estimate_tokens(content, media_type)

    @staticmethod
    def process_multipart_file(filename: str, content_type: str, raw_content: bytes) -> ProcessedFileResult:
        """
        Process raw multipart file uploads into Anthropic-compatible format.

        This is the entry point for files uploaded via FastAPI's multipart form data.
        It handles the raw bytes directly from the HTTP request, performs validation,
        and converts content to the appropriate format for Anthropic's API (base64 for PDFs,
        UTF-8 text for CSV/Python files).

        Pipeline position: HTTP Request → Multipart Processing → File Processing → Token Validation

        Args:
            filename: Original filename from the upload
            content_type: MIME type from the HTTP request header
            raw_content: Raw file bytes from the multipart upload

        Returns:
            ProcessedFileResult with content, media_type, and file_type for Anthropic

        Raises:
            ValueError: If file type is unsupported, too large, or content is invalid
        """
        # Validate file size first
        file_size = len(raw_content)

        # Determine file type from content type
        file_type = CONTENT_TYPE_MAPPING.get(content_type)
        if not file_type and filename.lower().endswith(".py"):
            file_type = "python"

        if not file_type:
            raise ValueError(f"Unsupported file type: {content_type} for file {filename}")

        # Validate file size using shared logic
        max_size = get_file_size_limit(file_type)
        if file_size > max_size:
            raise ValueError(format_file_size_error(filename, file_size, file_type))

        if content_type == "application/pdf":
            # Convert raw PDF to base64
            processed_content = base64.b64encode(raw_content).decode("utf-8")
            return {"content": processed_content, "media_type": "application/pdf", "file_type": "pdf"}
        else:
            # Text files (CSV, Python) - decode to string
            try:
                processed_content = raw_content.decode("utf-8")
            except UnicodeDecodeError as e:
                raise ValueError(f"Cannot decode {filename} as UTF-8: {str(e)}") from e

            # Return appropriate media type based on content type
            if content_type in ["text/csv", "application/csv", "application/vnd.ms-excel"]:
                return {"content": processed_content, "media_type": "text/csv", "file_type": "csv"}
            else:
                # Python files should be handled by the content type check above
                # If we reach here, it's likely a text file with .py extension
                if filename.lower().endswith(".py"):
                    return {"content": processed_content, "media_type": "text/x-python", "file_type": "python"}
                else:
                    raise ValueError(f"Unsupported file type for {filename}. Only PDF, CSV, and Python files are supported.")

    @staticmethod
    def check_files_token_warning(
        file_references: Optional[List[Dict[str, Any]]], anthropic_client: anthropic.Anthropic, model: Optional[str] = None
    ) -> Optional[str]:
        """
        Validate token limits for processed files before sending to Anthropic API.

        This function is called in the multipart upload handler AFTER files have been processed
        and validated, but BEFORE the chat completion request is made to Anthropic. It ensures
        the total token count across all uploaded files doesn't exceed Claude's context limits,
        providing early feedback to users about potential issues.

        Pipeline position: HTTP Handler → File Processing → Token Validation → Anthropic API

        Args:
            file_references: List of processed file dictionaries with content and metadata
            anthropic_client: Authenticated Anthropic client for token counting API calls
            model: Model name for accurate token counting (defaults to configured model)

        Returns:
            Warning message string if limits are exceeded, None if within limits
        """
        if not file_references:
            return None

        total_tokens = 0

        for file_ref in file_references:
            # Validate structure
            if not isinstance(file_ref, dict):
                logger.warning(f"Invalid file reference type: {type(file_ref)}")
                continue

            filename = file_ref.get("name", "unknown")
            content = file_ref.get("content", "")
            media_type = file_ref.get("media_type", "text/plain")

            # Skip empty content
            if not content:
                logger.info(f"Skipping empty file: {filename}")
                continue

            # Count tokens for this file
            tokens = FileProcessor.count_file_tokens(filename, content, media_type, anthropic_client, model)
            total_tokens += tokens

        if total_tokens > FileProcessor.MAX_TOTAL_TOKENS:
            return (
                f"Total file tokens ({total_tokens:,}) exceeds the maximum limit "
                f"({FileProcessor.MAX_TOTAL_TOKENS:,} tokens). Please reduce file sizes."
            )
        elif total_tokens > FileProcessor.WARNING_TOTAL_TOKENS:
            return (
                f"Warning: Total file tokens ({total_tokens:,}) is approaching the limit "
                f"({FileProcessor.MAX_TOTAL_TOKENS:,} tokens). Consider reducing file sizes to avoid issues."
            )

        return None
