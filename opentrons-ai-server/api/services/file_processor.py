"""
File processor service for handling file content processing
Server handles all file processing
"""

import base64
import csv
import io
import json
import logging
from typing import Literal, Optional, TypedDict

logger = logging.getLogger(__name__)

# Type definitions for better type safety
FileType = Literal["pdf", "csv", "python", "unknown"]
MediaType = Literal["application/pdf", "application/json", "text/csv", "text/x-python", "text/plain"]


class ProcessedFileResult(TypedDict):
    """Type definition for processed file results"""

    content: str
    media_type: MediaType
    file_type: FileType


class FileProcessor:
    """Process raw file content from frontend into appropriate formats for Anthropic"""

    # File size constants
    UNIT_KB = 1024
    UNIT_MB = UNIT_KB * UNIT_KB

    # Maximum sizes for different processing operations
    MAX_CSV_JSON_SIZE_KB = 500 * UNIT_KB  # 500KB limit for JSON conversion
    # Conservative base64 limit: ~100KB binary PDF → ~133KB base64 → ~150KB with overhead
    # Anthropic has ~200K token limit, so this leaves room for conversation context
    MAX_PDF_BASE64_LENGTH = 150000

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

        # Check size limit
        if len(content) > FileProcessor.MAX_PDF_BASE64_LENGTH:
            raise ValueError(
                f"PDF file {filename} is too large ({len(content)} characters). "
                f"Maximum allowed is {FileProcessor.MAX_PDF_BASE64_LENGTH} characters."
            )

        # Validate it's valid base64
        try:
            base64.b64decode(content, validate=True)
        except Exception as e:
            raise ValueError(f"Invalid base64 content for PDF {filename}: {str(e)}") from e

        return {"content": content, "media_type": "application/pdf", "file_type": "pdf"}

    @staticmethod
    def _process_csv(filename: str, content: str) -> ProcessedFileResult:
        """Process CSV file with robust parsing"""
        if not content:
            logger.info(f"CSV file {filename} is empty, returning empty JSON array")
            return {"content": "[]", "media_type": "application/json", "file_type": "csv"}

        # Check if CSV is too large to convert to JSON
        if len(content) > FileProcessor.MAX_CSV_JSON_SIZE_KB:
            logger.info(f"CSV file {filename} is large ({len(content)} bytes), sending as raw text")
            return {"content": content, "media_type": "text/csv", "file_type": "csv"}

        try:
            # Use Python's CSV module for robust parsing
            csv_reader = csv.DictReader(io.StringIO(content))
            data = list(csv_reader)

            # Convert to JSON
            json_content = json.dumps(data, separators=(",", ":"))  # Compact format

            # If resulting JSON is too large, fall back to CSV
            if len(json_content) > FileProcessor.MAX_CSV_JSON_SIZE_KB * 2:
                logger.info(f"Converted JSON for {filename} is too large ({len(json_content)} bytes), sending as CSV")
                return {"content": content, "media_type": "text/csv", "file_type": "csv"}

            logger.info(f"Successfully converted CSV file {filename} to JSON ({len(json_content)} characters)")
            return {"content": json_content, "media_type": "application/json", "file_type": "csv"}

        except Exception as e:
            # If CSV parsing fails, return as raw text
            logger.warning(f"CSV parsing failed for {filename}: {str(e)}")
            return {"content": content, "media_type": "text/csv", "file_type": "csv"}

    @staticmethod
    def _process_python(filename: str, content: str) -> ProcessedFileResult:
        """Process Python file"""
        # Could add Python syntax validation here if needed
        return {"content": content, "media_type": "text/x-python", "file_type": "python"}

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
        if mime_type == "application/pdf" and content_size > 7 * FileProcessor.UNIT_MB:  # ~5MB file becomes ~7MB base64
            return f"PDF file {filename} is too large"
        elif mime_type in ["text/csv", "application/csv"] and content_size > 2 * FileProcessor.UNIT_MB:
            return f"CSV file {filename} is too large (max 2MB)"
        elif content_size > 1 * FileProcessor.UNIT_MB and filename.endswith(".py"):
            return f"Python file {filename} is too large (max 1MB)"

        return None
