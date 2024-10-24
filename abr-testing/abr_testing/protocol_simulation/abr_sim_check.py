"""Check ABR Protocols Simulate Successfully."""
from abr_testing.protocol_simulation import simulation_metrics
import os
import traceback
from pathlib import Path


def run(file_to_simulate: str) -> None:
    """Simulate protocol and raise errors."""
    protocol_name = Path(file_to_simulate).stem
    try:
        simulation_metrics.main(file_to_simulate, False)
    except Exception:
        print(f"Error in protocol: {protocol_name}")
        traceback.print_exc()


if __name__ == "__main__":
    # Directory to search
    root_dir = "abr_testing/protocols"

    exclude = [
        "__init__.py",
        "shared_vars_and_funcs.py",
    ]
    # Walk through the root directory and its subdirectories
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".py"):  # If it's a Python file
                if file in exclude:
                    continue
                file_path = os.path.join(root, file)
                print(f"Simulating protocol: {file_path}")
                run(file_path)
