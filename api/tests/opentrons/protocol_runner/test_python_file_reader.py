"""Tests for the Python protocol reading."""
from pathlib import Path
from inspect import Signature, Parameter, signature

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api_experimental import ProtocolContext
from opentrons.protocol_reader import ProtocolSource, PythonProtocolConfig
from opentrons.protocol_runner.python_file_reader import PythonFileReader


def test_read_gets_run_method(python_protocol_file: Path) -> None:
    """It should pull the run method out of the Python file."""
    subject = PythonFileReader()
    protocol_source = ProtocolSource(
        directory=python_protocol_file.parent,
        main_file=python_protocol_file,
        files=[],
        metadata={},
        config=PythonProtocolConfig(api_version=APIVersion(3, 0)),
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
