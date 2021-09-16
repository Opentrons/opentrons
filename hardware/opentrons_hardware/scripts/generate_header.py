"""Script to generate c++ header file of canbus constants."""
import argparse
import io
from enum import Enum
from pathlib import Path
from typing import Type

from opentrons_hardware.drivers.can_bus import (
    MessageId,
    FunctionCode,
    NodeId,
)


def run(file: Path) -> None:
    """Entry point for script."""
    with io.StringIO() as output:
        generate(output)

        output_string = output.getvalue()
        file.write_text(output_string)

        print(output_string)


def generate(output: io.StringIO) -> None:
    """Generate source code into output."""
    output.write("/********************************************\n")
    output.write("* This is a generated file. Do not modify.  *\n")
    output.write("********************************************/\n")
    output.write("#pragma once\n\n")
    write_enum(FunctionCode, output)
    write_enum(MessageId, output)
    write_enum(NodeId, output)


def write_enum(e: Type[Enum], output: io.StringIO) -> None:
    """Generate enum class from enumeration."""
    output.write(f"/** {e.__doc__} */\n")
    output.write(f"enum class {e.__name__} {{\n")
    for i in e:
        output.write(f"  {i.name} = 0x{i.value:x},\n")
    output.write("};\n\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a C++ header file defining CANBUS constants."
    )
    parser.add_argument(
        "--target",
        type=str,
        required=True,
        help="path of header file to generate",
    )

    args = parser.parse_args()

    run(Path(args.target))
