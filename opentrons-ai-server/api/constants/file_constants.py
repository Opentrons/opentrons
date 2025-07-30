"""
Shared file processing constants to avoid duplication across modules.
"""

# File size constants
UNIT_KB = 1024
UNIT_MB = UNIT_KB * UNIT_KB

# File size limits by type
FILE_SIZE_LIMITS = {
    "pdf": 5 * UNIT_MB,
    "csv": 2 * UNIT_MB,
    "python": 1 * UNIT_MB,
}

# Media type mappings (canonical values)
MEDIA_TYPE_MAPPING = {
    "pdf": "application/pdf",
    "csv": "text/csv",  # Fixed: was incorrectly "application/json" in fast.py
    "python": "text/x-python",
    "plain": "text/plain",
}

# Supported file extensions to content types
CONTENT_TYPE_MAPPING = {
    "application/pdf": "pdf",
    "text/csv": "csv",
    "application/csv": "csv",
    "application/vnd.ms-excel": "csv",
    "text/x-python": "python",
    "text/x-python-script": "python",
    "text/plain": "python",  # when filename ends with .py
    "application/x-python-code": "python",
}


def get_file_size_limit(file_type: str) -> int:
    """Get size limit for a file type."""
    return FILE_SIZE_LIMITS.get(file_type, UNIT_MB)  # Default 1MB


def format_file_size_error(filename: str, actual_size: int, file_type: str) -> str:
    """Format consistent file size error messages."""
    max_size = get_file_size_limit(file_type)
    return f"File {filename} is too large ({actual_size/UNIT_MB:.1f}MB). " f"Maximum size for {file_type} files is {max_size/UNIT_MB}MB."
