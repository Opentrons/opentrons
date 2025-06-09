import asyncio
import io
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence

import anyio

# Import the internal async analysis function and the _Output class.
from opentrons.cli.analyze import _analyze, _Output  # type: ignore[import-not-found]

# Imports for pretty printing with Rich.
from rich.progress import BarColumn, Progress, TextColumn, TimeElapsedColumn

from automation.data.protocol import Protocol

CUSTOM_LABWARE_DIR = Path(__file__).parent.parent / "files" / "labware"
custom_labware_files = list(CUSTOM_LABWARE_DIR.glob("*.json"))
ANALYSIS_TIMEOUT = 120  # Timeout per protocol in seconds
OUTPUT_DIR: Path = Path(Path(__file__).parent.parent, "analysis_results")
OUTPUT_SUFFIX = "_analysis.json"


@dataclass
class AnalysisResult:
    """Dataclass to hold the analysis result."""

    protocol_file: Path
    analysis: dict[str, Any]
    logs: str = ""

    @property
    def protocol_name(self) -> str:
        """Get the name of the protocol file."""
        return self.protocol_file.name

    @property
    def is_successful(self) -> bool:
        """Check if the analysis result indicates success."""
        return not bool(self.analysis.get("errors")) if isinstance(self.analysis, dict) else False


def extract_first_json_object(text: str) -> dict[str, Any] | None:
    """
    Attempts to extract the first valid JSON object from the given text string.
    Returns the parsed dict, or None if extraction fails.
    """
    match = re.search(r'(\{.*\})', text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except Exception:
        return None


def _subprocess_entrypoint():
    """
    Entrypoint for subprocess: runs _analyze for a single protocol file, prints JSON to stdout, and exits.
    """
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=str, required=True)
    parser.add_argument("--rtp_values", type=str, default="{}")
    parser.add_argument("--rtp_files", type=str, default="{}")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    protocol_file = Path(args.file)
    files = custom_labware_files + [protocol_file]
    json_output_stream = io.BytesIO()
    outputs = [_Output(to_file=json_output_stream, kind="json")]
    try:
        exit_code = asyncio.run(_analyze(files, args.rtp_values, args.rtp_files, outputs, args.check))
    except Exception as e:
        print(json.dumps({"error": f"Exception: {str(e)}"}), file=sys.stdout)
        sys.exit(1)
    json_output_stream.seek(0)
    json_bytes = json_output_stream.read()
    try:
        json_str = json_bytes.decode("utf-8")
        try:
            result_json = json.loads(json_str)
        except Exception:
            result_json = extract_first_json_object(json_str)
            if result_json is None:
                result_json = {"error": "Failed to decode JSON output"}
    except Exception:
        result_json = {"error": "Failed to decode JSON output"}
    print(json.dumps(result_json), file=sys.stdout)
    sys.exit(exit_code)


async def run_analysis(
    file: Path,
    rtp_values: str = "{}",
    rtp_files: str = "{}",
    check: bool = False,
) -> AnalysisResult:
    """
    Run protocol analysis in a subprocess and return the analysis results as in-memory JSON.
    This captures all output, including from C extensions and subprocesses.
    """
    protocol_file = file
    cmd = [
        sys.executable,
        str(Path(__file__).resolve()),
        "--_subprocess-run",
        "--file",
        str(file),
        "--rtp_values",
        rtp_values,
        "--rtp_files",
        rtp_files,
    ]
    if check:
        cmd.append("--check")
    try:
        proc = await anyio.to_thread.run_sync(lambda: subprocess.run(cmd, capture_output=True, text=True, timeout=ANALYSIS_TIMEOUT))
        stdout = proc.stdout
        stderr = proc.stderr
        result_json = None
        try:
            result_json = json.loads(stdout)
        except Exception:
            result_json = extract_first_json_object(stdout)
            if result_json is None:
                result_json = {"error": "Failed to decode JSON output", "raw": stdout}
        logs = stderr
    except subprocess.TimeoutExpired:
        result_json = {"error": f"Analysis timed out after {ANALYSIS_TIMEOUT} seconds"}
        logs = ""
    except Exception as e:
        result_json = {"error": f"Analysis failed with error: {str(e)}"}
        logs = ""
    return AnalysisResult(protocol_file=protocol_file, analysis=result_json, logs=logs)


def analyze_protocol_files(protocol_files: list[Path]) -> list[AnalysisResult]:
    """
    Analyze a list of protocol files and return a list of AnalysisResult objects.
    This is a synchronous wrapper for use in other programs, with progress output.
    """
    import asyncio

    results: list[AnalysisResult] = []

    async def _run():
        nonlocal results
        total = len(protocol_files)
        with Progress(
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            "[progress.percentage]{task.percentage:>3.0f}%",
            "|",
            "[cyan]{task.completed}/{task.total}",
            TimeElapsedColumn(),
            transient=True,
        ) as progress:
            task_id = progress.add_task("Analyzing protocols", total=total)

            async def run_and_collect(file: Path) -> None:
                try:
                    results.append(await run_analysis(file))
                except Exception:
                    pass
                progress.update(task_id, advance=1)

            async with anyio.create_task_group() as tg:
                for file in protocol_files:
                    tg.start_soon(run_and_collect, file)

    asyncio.run(_run())
    return results


def analysis_output_path(analysis: AnalysisResult) -> Path:
    """
    Get the output path for the analysis result of a given Protocol.
    """
    return OUTPUT_DIR / f"{analysis.protocol_file.stem}{OUTPUT_SUFFIX}"


def gen_analyses_files(protocols: Sequence[Protocol]) -> list[AnalysisResult]:
    """
    Analyze a list of Protocol objects (automation.data.protocol.Protocol) and write analysis files to output_dir.
    Returns a list of AnalysisResult objects.
    """
    protocol_files = [Path(proto.file_path) for proto in protocols]
    results = analyze_protocol_files(protocol_files)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for result in results:
        with open(analysis_output_path(result), "w") as f:
            json.dump(result.analysis, f, indent=2)
    return results


if __name__ == "__main__":
    # Check if the script is running as a subprocess and remove the flag to avoid interference.
    if "--_subprocess-run" in sys.argv:
        sys.argv.remove("--_subprocess-run")
        _subprocess_entrypoint()
