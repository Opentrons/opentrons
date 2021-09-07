"""Tests for the Python protocol reading."""
from pathlib import Path
from inspect import Signature, Parameter, signature

from opentrons.protocol_api_experimental import ProtocolContext
from opentrons.protocol_runner.protocol_file import ProtocolFile, ProtocolFileType
from opentrons.protocol_runner.python_file_reader import PythonFileReader


def test_read_gets_run_method(python_protocol_file: Path) -> None:
    """It should pull the run method out of the Python file."""
    subject = PythonFileReader()
    protocol_file = ProtocolFile(
        protocol_type=ProtocolFileType.PYTHON,
        files=[python_protocol_file],
    )
    result = subject.read(protocol_file)

    assert signature(result.run) == Signature(
        parameters=[
            Parameter(
                name="context",
                kind=Parameter.POSITIONAL_OR_KEYWORD,
                annotation=ProtocolContext,
            )
        ],
        return_annotation=None,
    )
