import json
import sys
from pathlib import Path

from automation.analyze import OUTPUT_DIR, AnalysisResult, gen_analyses_files
from automation.data.collect import CHUNK_DIR
from automation.data.protocol import Protocol


def gen_analyses_files_from_chunks(chunk_file_name) -> list[AnalysisResult]:
    """
    Analyze a list of chunk files and write analysis files to OUTPUT_DIR.
    Returns a list of AnalysisResult objects.
    """
    chunk_file = Path(CHUNK_DIR, chunk_file_name)
    try:
        if not chunk_file.exists():
            raise FileNotFoundError(f"Chunk file {chunk_file} does not exist.")
        with open(chunk_file, "r") as f:
            chunk_file_content = json.load(f)
        protocols = [Protocol.model_validate_json(p) for p in chunk_file_content]
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to decode JSON from chunk file {chunk_file}: {e}") from e
    results = gen_analyses_files(protocols)
    return results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--chunk_file",
        type=str,
        required=True,
        help="The name of the chunk file to analyze (e.g., 'chunk_0.json').",
    )
    args = parser.parse_args()

    results = gen_analyses_files_from_chunks(args.chunk_file)

    # Print summary of results
    for result in results:
        print(f"Protocol: {result.protocol_name}, Success: {result.is_successful}, Errors: {result.analysis.get('errors', [])}")
    print(f"Analysis results written to {OUTPUT_DIR}.")
    print(f"Chunk file used: {args.chunk_file}")
    print(f"Total protocols analyzed: {len(results)}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Chunk directory: {CHUNK_DIR}")
    print("Done.")
    sys.exit(0)
