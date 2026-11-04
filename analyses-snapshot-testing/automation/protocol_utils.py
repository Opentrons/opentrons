"""
Shared utilities for protocol analysis functionality.

This module contains reusable functions and classes that can be used both by the
existing analysis_snapshots code and the new CLI tool.
"""

import json
from pathlib import Path
from typing import List, Optional

from automation.analyze import AnalysisResult, analyze_protocol_files
from automation.data.protocol import Protocol


def discover_protocol_files_in_directory(directory: Path, extensions: Optional[List[str]] = None) -> List[Path]:
    """
    Discover protocol files in a directory.

    Args:
        directory: Directory to search for protocol files.
        extensions: List of file extensions to search for. Defaults to ['py', 'json'].

    Returns:
        List of protocol file paths.

    Raises:
        FileNotFoundError: If the directory does not exist.
    """
    if not directory.exists():
        raise FileNotFoundError(f"Directory does not exist: {directory}")

    if extensions is None:
        extensions = ["py", "json"]

    protocol_files = []
    for ext in extensions:
        pattern = f"**/*.{ext}"
        matches = list(directory.glob(pattern))
        protocol_files.extend(matches)

    # Filter out common non-protocol files
    filtered_files = []
    for file_path in protocol_files:
        if file_path.name.startswith(".") or file_path.name in [
            "__init__.py",
            "conftest.py",
        ]:
            continue
        filtered_files.append(file_path)

    return sorted(filtered_files)


def validate_protocol_file(file_path: Path) -> bool:
    """
    Validate that a file appears to be a protocol.

    Args:
        file_path: Path to the file to validate.

    Returns:
        True if the file appears to be a valid protocol, False otherwise.
    """
    try:
        if file_path.suffix == ".py":
            # Check for common protocol indicators in Python files
            content = file_path.read_text(encoding="utf-8")
            indicators = ["def run(", "metadata", "requirements", "opentrons"]
            return any(indicator in content for indicator in indicators)
        elif file_path.suffix == ".json":
            # Check for valid JSON with protocol structure
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Basic check for protocol-like structure
            return isinstance(data, dict) and ("commands" in data or "designerApplication" in data)
    except Exception:
        return False

    return False


def create_protocol_from_file_path(file_path: Path) -> Protocol:
    """
    Create a Protocol object from a file path.

    Args:
        file_path: Path to the protocol file.

    Returns:
        Protocol object.
    """
    robot_type = "Flex"

    # Get file extension without the dot and validate it
    file_ext = file_path.suffix[1:]  # Remove the dot
    if file_ext not in ["json", "py"]:
        file_ext = "py"  # Default to py if unknown

    return Protocol(
        file_stem=file_path.stem,
        folder=file_path.parent,
        file_extension=file_ext,  # type: ignore
        robot=robot_type,  # type: ignore
    )


def save_analysis_snapshot(result: AnalysisResult, output_dir: Path, filename_suffix: str = "_analysis.json") -> Path:
    """
    Save an analysis result as a snapshot file.

    Args:
        result: AnalysisResult to save.
        output_dir: Directory to save the snapshot file.
        filename_suffix: Suffix to append to the protocol filename.

    Returns:
        Path to the saved snapshot file.
    """
    output_filename = f"{result.protocol_file.stem}{filename_suffix}"
    output_path = output_dir / output_filename

    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save the analysis result
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result.analysis, f, indent=2)

    return output_path


def batch_analyze_protocols(protocol_files: List[Path], custom_labware_files: Optional[List[Path]] = None) -> List[AnalysisResult]:
    """
    Analyze a batch of protocol files.

    Args:
        protocol_files: List of protocol files to analyze.
        custom_labware_files: Optional list of custom labware files to include.

    Returns:
        List of AnalysisResult objects.
    """
    # Set up custom labware if provided
    if custom_labware_files:
        # Note: The analyze_protocol_files function in analyze.py already handles
        # custom labware via the CUSTOM_LABWARE_DIR constant, but we could extend
        # this if needed for more flexible labware handling
        pass

    return analyze_protocol_files(protocol_files)


def filter_successful_analyses(results: List[AnalysisResult]) -> List[AnalysisResult]:
    """
    Filter analysis results to only include successful ones.

    Args:
        results: List of AnalysisResult objects.

    Returns:
        List of successful AnalysisResult objects.
    """
    return [result for result in results if result.is_successful]


def filter_failed_analyses(results: List[AnalysisResult]) -> List[AnalysisResult]:
    """
    Filter analysis results to only include failed ones.

    Args:
        results: List of AnalysisResult objects.

    Returns:
        List of failed AnalysisResult objects.
    """
    return [result for result in results if not result.is_successful]


def generate_analysis_summary(results: List[AnalysisResult]) -> dict:
    """
    Generate a summary of analysis results.

    Args:
        results: List of AnalysisResult objects.

    Returns:
        Dictionary containing summary statistics.
    """
    total = len(results)
    successful = len(filter_successful_analyses(results))
    failed = total - successful

    return {
        "total_protocols": total,
        "successful_analyses": successful,
        "failed_analyses": failed,
        "success_rate": (successful / total * 100) if total > 0 else 0.0,
        "protocol_names": [result.protocol_name for result in results],
        "successful_protocols": [result.protocol_name for result in filter_successful_analyses(results)],
        "failed_protocols": [result.protocol_name for result in filter_failed_analyses(results)],
    }
