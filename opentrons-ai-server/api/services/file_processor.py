"""
File processor service for handling file content processing
Server handles all file processing
"""

import base64
import logging
from typing import Any, Dict, List, Literal, Optional, TypedDict

import anthropic
from api.constants.file_constants import CONTENT_TYPE_MAPPING, FILE_SIZE_LIMITS, format_file_size_error, get_file_size_limit
from ddtrace import tracer

logger = logging.getLogger(__name__)

# Type definitions for better type safety
FileType = Literal["pdf", "csv", "python", "unknown"]
MediaType = Literal["application/pdf", "text/csv", "text/x-python", "text/plain"]


class ProcessedFileResult(TypedDict):
    """Type definition for processed file results"""

    content: str
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
        """Estimate token count when API call fails."""
        if media_type == "application/pdf":
            # Base64 increases size by ~33%, PDF typically has ~8 chars per token
            # Add overhead for document block structure
            original_size = len(content) * 0.75
            return int(original_size / 8) + 100
        # Text content averages ~4 characters per token
        return len(content) // 4

    @staticmethod
    @tracer.wrap()
    def count_file_tokens(
        filename: str, content: str, media_type: str, anthropic_client: anthropic.Anthropic, model: Optional[str] = None
    ) -> int:
        """Count tokens for a file using Anthropic API with fallback estimation."""
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
                model=model or "claude-3-5-sonnet-20241022", messages=[{"role": "user", "content": message_content}]  # type: ignore
            )

            logger.info(f"File {filename} token count: {token_count_response.input_tokens}")
            return token_count_response.input_tokens

        except anthropic.APIError as e:
            logger.warning(f"Could not count tokens for file {filename} ({media_type}): {e}")
            return FileProcessor._estimate_tokens(content, media_type)

    @staticmethod
    def process_multipart_file(filename: str, content_type: str, raw_content: bytes) -> ProcessedFileResult:
        """Process a raw file from multipart upload directly without double processing."""
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

        # Process content based on type without double processing
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
            elif filename.lower().endswith(".py"):
                return {"content": processed_content, "media_type": "text/x-python", "file_type": "python"}
            else:
                return {"content": processed_content, "media_type": "text/plain", "file_type": "unknown"}

    @staticmethod
    def process_file(filename: str, mime_type: str, content: str) -> ProcessedFileResult:
        """
        Process a file based on its MIME type

        Args:
            filename: Original filename
            mime_type: MIME type as reported by browser
            content: Raw file content (base64 for PDFs, text for others)

        Returns:
            Dict with processed content and media type for Anthropic
        """
        # Determine file type from MIME type
        if mime_type == "application/pdf":
            return FileProcessor._process_pdf(filename, content)
        elif mime_type in ["text/csv", "application/csv", "application/vnd.ms-excel"]:
            return FileProcessor._process_csv(filename, content)
        elif mime_type in ["text/x-python", "text/x-python-script", "text/plain", "application/x-python-code"]:
            # Check if it's actually a Python file
            if filename.lower().endswith(".py"):
                return FileProcessor._process_python(filename, content)

        # Default: treat as plain text
        return {"content": content, "media_type": "text/plain", "file_type": "unknown"}

    @staticmethod
    def _process_pdf(filename: str, content: str) -> ProcessedFileResult:
        """Process PDF file (already base64 encoded from frontend)"""
        # Validate base64 content
        if not content:
            raise ValueError(f"PDF file {filename} has empty content")

        # Validate it's valid base64
        try:
            base64.b64decode(content, validate=True)
        except Exception as e:
            raise ValueError(f"Invalid base64 content for PDF {filename}: {str(e)}") from e

        return {"content": content, "media_type": "application/pdf", "file_type": "pdf"}

    @staticmethod
    def _process_csv(filename: str, content: str) -> ProcessedFileResult:
        """Process CSV file - Claude handles CSV natively, no conversion needed"""
        if not content:
            logger.info(f"CSV file {filename} is empty")
            return {"content": "", "media_type": "text/csv", "file_type": "csv"}

        logger.info(f"Processing CSV file {filename} ({len(content)} bytes) as plain text")
        return {"content": content, "media_type": "text/csv", "file_type": "csv"}

    @staticmethod
    def _process_python(filename: str, content: str) -> ProcessedFileResult:
        """Process Python file"""
        # Could add Python syntax validation here if needed
        return {"content": content, "media_type": "text/x-python", "file_type": "python"}

    @staticmethod
    @tracer.wrap()
    def check_files_token_warning(
        file_references: Optional[List[Dict[str, Any]]], anthropic_client: anthropic.Anthropic, model: Optional[str] = None
    ) -> Optional[str]:
        """Check if total tokens across all files exceeds limits and return warning message."""
        if not file_references:
            return None

        total_tokens = 0

        for file_ref in file_references:
            # Validate structure
            if not isinstance(file_ref, dict):
                logger.warning(f"Invalid file reference type: {type(file_ref)}")
                continue

            filename = file_ref.get("filename", "unknown")
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

    @staticmethod
    def validate_file_content(filename: str, mime_type: str, content: str) -> Optional[str]:
        """
        Validate file content matches expected type

        Returns:
            Error message if validation fails, None if valid
        """
        if not content:
            return f"File {filename} has empty content"

        # PDF validation
        if mime_type == "application/pdf":
            if not content:
                return f"PDF file {filename} has no content"
            try:
                base64.b64decode(content, validate=True)
            except Exception:
                return f"PDF file {filename} contains invalid base64 content"

        # Size validation (approximate, before processing)
        content_size = len(content)

        if mime_type == "application/pdf":
            # Base64 encoded PDFs are ~33% larger than original
            estimated_original_size = int(content_size * 0.75)
            if estimated_original_size > FILE_SIZE_LIMITS["pdf"]:
                return format_file_size_error(filename, estimated_original_size, "pdf")
        elif mime_type in ["text/csv", "application/csv", "application/vnd.ms-excel"]:
            if content_size > FILE_SIZE_LIMITS["csv"]:
                return format_file_size_error(filename, content_size, "csv")
        elif filename.lower().endswith(".py") and content_size > FILE_SIZE_LIMITS["python"]:
            return format_file_size_error(filename, content_size, "python")

        return None
