import json
import os
from pathlib import Path
from typing import Any, List

from automation.data.protocol import Protocol
from automation.data.protocol_registry import ProtocolRegistry

CHUNK_SIZE = 25
CHUNK_DIR = Path(Path(__file__).parent.parent.parent, "chunks")
MATRIX_FILE = Path(CHUNK_DIR, "matrix.json")


def protocols_under_test() -> List[Protocol]:
    "Use the PROTOCOL_NAMES and OVERRIDE_PROTOCOL_NAMES environment variables to determine which protocols to test."
    # make snapshot-test-update PROTOCOL_NAMES="Flex_S_v2_19_Example" OVERRIDE_PROTOCOL_NAMES="none"
    protocol_names = os.getenv("PROTOCOL_NAMES")
    override_protocol_names = os.getenv("OVERRIDE_PROTOCOL_NAMES")
    if not protocol_names:
        exit("PROTOCOL_NAMES environment variable not set.")
    if not override_protocol_names:
        exit("OVERRIDE_PROTOCOL_NAMES environment variable not set.")
    protocol_registry: ProtocolRegistry = ProtocolRegistry(protocol_names=protocol_names, override_protocol_names=override_protocol_names)
    if not protocol_registry.protocols_to_test:
        exit("No protocols were resolved from the protocol names provided. Exiting.")
    return protocol_registry.protocols_to_test


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    Break a list into evenly sized chunks.
    If the final chunk is less than half the chunk_size, redistribute the last two chunks evenly.
    """
    n = len(lst)
    chunks = [lst[i : i + chunk_size] for i in range(0, n, chunk_size)]
    # If there are at least 2 chunks and the last chunk is less than half the chunk_size
    if len(chunks) >= 2 and len(chunks[-1]) < chunk_size // 2:
        # Combine the last two chunks
        last_two = chunks[-2] + chunks[-1]
        # Split them as evenly as possible
        mid = (len(last_two) + 1) // 2
        chunks[-2] = last_two[:mid]
        chunks[-1] = last_two[mid:]
    return chunks


def generate_protocol_chunks() -> None:
    os.makedirs(CHUNK_DIR, exist_ok=True)

    protocols = protocols_under_test()
    print(f"Found {len(protocols)} protocols to chunk from protocols_under_test().")
    serialized_protocols = [p.to_json() for p in protocols]
    chunks = chunk_list(serialized_protocols, CHUNK_SIZE)

    matrix_entries = []

    for i, chunk in enumerate(chunks):
        chunk_filename = f"chunk_{i}.json"
        chunk_path = os.path.join(CHUNK_DIR, chunk_filename)

        with open(chunk_path, "w") as f:
            json.dump(chunk, f, indent=2)

        matrix_entries.append({"chunk_id": chunk_filename})

    # Write out matrix.json
    with open(MATRIX_FILE, "w") as f:
        json.dump(matrix_entries, f, indent=2)

    print(f"✅ Created {len(chunks)} chunks for matrix job input.")


if __name__ == "__main__":
    generate_protocol_chunks()
    print(f"✅ Generated protocol chunks in '{CHUNK_DIR}' and matrix file '{MATRIX_FILE}'.")
