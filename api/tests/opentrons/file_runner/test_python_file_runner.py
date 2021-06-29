"""Tests for a PythonFileRunner interface."""
import pytest
from pathlib import Path
from decoy import Decoy

from opentrons.protocol_api_experimental import ProtocolContext
from opentrons.file_runner import PythonFileRunner, ProtocolFile, ProtocolFileType
from opentrons.file_runner.python_file_reader import PythonFileReader, PythonProtocol
from opentrons.file_runner.python_executor import PythonExecutor
from opentrons.file_runner.context_creator import ProtocolContextCreator


@pytest.fixture
def protocol_file(decoy: Decoy) -> ProtocolFile:
    """Get a PythonProtocolFile value fixture."""
    return ProtocolFile(file_type=ProtocolFileType.PYTHON, file_path=Path("/dev/null"))


@pytest.fixture
def python_protocol(decoy: Decoy) -> PythonProtocol:
    return decoy.create_decoy(spec=PythonProtocol)


@pytest.fixture
def protocol_context(decoy: Decoy) -> ProtocolContext:
    return decoy.create_decoy(spec=ProtocolContext)


@pytest.fixture
def file_reader(decoy: Decoy) -> PythonFileReader:
    return decoy.create_decoy(spec=PythonFileReader)


@pytest.fixture
def context_creator(decoy: Decoy) -> ProtocolContextCreator:
    return decoy.create_decoy(spec=ProtocolContextCreator)


@pytest.fixture
def executor(decoy: Decoy) -> PythonExecutor:
    return decoy.create_decoy(spec=PythonExecutor)


@pytest.fixture
def subject(
    protocol_file: ProtocolFile,
    file_reader: PythonFileReader,
    context_creator: ProtocolContextCreator,
    executor: PythonExecutor,
) -> PythonFileRunner:
    """Get a PythonFileRunner test subject with its dependencies mocked out."""
    return PythonFileRunner(
        file=protocol_file,
        file_reader=file_reader,
        context_creator=context_creator,
        executor=executor,
    )


def test_python_runner_load(
    decoy: Decoy,
    protocol_file: ProtocolFile,
    file_reader: PythonFileReader,
    python_protocol: PythonProtocol,
    context_creator: ProtocolContextCreator,
    protocol_context: ProtocolContext,
    executor: PythonExecutor,
    subject: PythonFileRunner,
) -> None:
    """It should be able to load the module and prepare a ProtocolContext."""
    decoy.when(file_reader.read(file=protocol_file)).then_return(python_protocol)
    decoy.when(context_creator.create(protocol=python_protocol)).then_return(
        protocol_context
    )

    subject.load()

    decoy.verify(executor.load(protocol=python_protocol, context=protocol_context))


def test_python_runner_play(
    decoy: Decoy,
    executor: PythonExecutor,
    subject: PythonFileRunner,
) -> None:
    """It should be able to start the run."""
    subject.play()
    decoy.verify(executor.execute())


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_python_runner_pause(subject: PythonFileRunner) -> None:
    """It should be able to pause the run."""
    subject.pause()


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_python_runner_stop(subject: PythonFileRunner) -> None:
    """It should be able to stop the run."""
    subject.stop()
