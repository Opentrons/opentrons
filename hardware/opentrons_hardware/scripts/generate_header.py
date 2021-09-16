"""Script to generate c++ header file of canbus constants."""
import argparse
import io
from pathlib import Path

from opentrons_hardware.drivers.can_bus import (
    CanDriver,
    MessageId,
    FunctionCode,
    NodeId,
    CanMessage,
    ArbitrationId,
    ArbitrationIdParts,
)


def run(file: Path) -> None:
    """Entry point for script."""
    with io.StringIO() as output:
        output.write("/********************************************\n")
        output.write("* This is a generated file. Do not modify.  *\n")
        output.write("********************************************/\n")
        output.write("#pragma once\n")

        # Function code
        output.write("/* Function code definitions. */\n")
        output.write(f"enum class {FunctionCode.__name__} {{\n")
        for i in FunctionCode:
            output.write(f"  {i.name} = 0x{i.value:x},\n")

        output.write("}\n")


        file.write_text(output.getvalue())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a C++ header file defining CANBUS constants.")
    parser.add_argument(
        "--target",
        type=str,
        required=True,
        help="path of header file to generate",
    )

    args = parser.parse_args()

    run(Path(args.target))

