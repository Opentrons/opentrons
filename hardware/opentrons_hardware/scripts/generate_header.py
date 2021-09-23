"""Script to generate c++ header file of canbus constants."""
from __future__ import annotations
import argparse
import io
from enum import Enum
from pathlib import Path
from typing import Type, Any

from opentrons_hardware.drivers.can_bus import (
    MessageId,
    FunctionCode,
    NodeId,
)


class block:
    """C block generator."""

    def __init__(self, output: io.StringIO, start: str, terminate: str) -> None:
        """Construct a code block context manager.

        Args:
            output: the buffer in which to write
            start: the text that begins the block
            terminate: the text that ends the block
        """
        self._output = output
        self._start = start
        self._terminate = terminate

    def __enter__(self) -> block:
        """Enter the context manager."""
        self._output.write(self._start)
        return self

    def __exit__(self, *exc: Any) -> None:
        """Exit the context manager."""
        self._output.write(self._terminate)


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
    with block(
        output=output,
        start="namespace can_ids {\n\n",
        terminate="} // namespace can_ids\n\n",
    ):
        write_enum(FunctionCode, output)
        write_enum(MessageId, output)
        write_enum(NodeId, output)


def write_enum(e: Type[Enum], output: io.StringIO) -> None:
    """Generate enum class from enumeration."""
    output.write(f"/** {e.__doc__} */\n")
    with block(
        output=output, start=f"enum class {e.__name__} {{\n", terminate="};\n\n"
    ):
        for i in e:
            output.write(f"  {i.name} = 0x{i.value:x},\n")


def main() -> None:
    """Entry point."""
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


if __name__ == "__main__":
    main()
