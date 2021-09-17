"""Tests for the Python protocol reading."""
from pathlib import Path
from inspect import Signature, Parameter, signature

from opentrons.protocol_api_experimental import ProtocolContext
from opentrons.protocol_runner.protocol_source import ProtocolSource
from opentrons.protocol_runner.pre_analysis import PythonPreAnalysis
from opentrons.protocol_runner.python_file_reader import PythonFileReader


def test_read_gets_run_method(python_protocol_file: Path) -> None:
    """It should pull the run method out of the Python file."""
    subject = PythonFileReader()
    protocol_source = ProtocolSource(
        files=[python_protocol_file],
        pre_analysis=PythonPreAnalysis(metadata={}, api_level="3.0"),
    )
    result = subject.read(protocol_source)

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
