import subprocess
import pathlib
from opentrons.cli.analyze import AnalyzeResults



async def run_analysis(protocol_content: str, tmp_path: pathlib.Path) -> AnalyzeResults:
    """Run the analysis on the generated protocol."""
    protocol_path = tmp_path / "protocol.py"
    analysis_json_path = tmp_path / "analysis_result.json"

    protocol_path.write_text(protocol_content)

    command = [
        "python",
        "-m",
        "opentrons.cli",
        "analyze",
        str(protocol_path),
        "--human-json-output",
        str(analysis_json_path),
    ]

    # Run the command
    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"Analysis failed: {result.stderr}\n{protocol_content}\n")

    return AnalyzeResults.parse_file(analysis_json_path)

def make_the_failed_protocol_pretty(protocol_content: str) -> str:
    """Pretty print the protocol."""
    command = [
        "black",
        "-",
    ]

    # Run the command
    result = subprocess.run(
        command, input=protocol_content, capture_output=True, text=True
    )

    if result.returncode != 0:
        raise Exception(f"Black failed: {result.stderr}\n{protocol_content}\n")

    return result.stdout


def has_errors(analysis_response: AnalyzeResults) -> bool:
    """Check if the analysis response has errors."""
    return len(analysis_response.errors) > 0