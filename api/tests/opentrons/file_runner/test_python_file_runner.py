"""Tests for a PythonFileRunner interface."""
import pytest
from pathlib import Path
from decoy import Decoy

from opentrons.protocol_api_experimental import ProtocolContext
from opentrons.file_runner import PythonFileRunner, ProtocolFile, ProtocolFileType
from opentrons.file_runner.python_reader import PythonFileReader, PythonProtocol
from opentrons.file_runner.python_executor import PythonExecutor
from opentrons.file_runner.context_creator import ContextCreator


@pytest.fixture
def protocol_file(decoy: Decoy) -> ProtocolFile:
    """Get a PythonProtocolFile value fixture."""
    return ProtocolFile(file_type=ProtocolFileType.PYTHON, file_path=Path("/dev/null"))


@pytest.fixture
def python_protocol(decoy: Decoy) -> PythonProtocol:
    """Get a mock PythonProtocol object."""
    return decoy.mock(cls=PythonProtocol)


@pytest.fixture
def protocol_context(decoy: Decoy) -> ProtocolContext:
    """Get a mock ProtocolContext API interface."""
    return decoy.mock(cls=ProtocolContext)


@pytest.fixture
def file_reader(decoy: Decoy) -> PythonFileReader:
    """Get a mock FileReader."""
    return decoy.mock(cls=PythonFileReader)


@pytest.fixture
def context_creator(decoy: Decoy) -> ContextCreator:
    """Get a mock ContextCreator."""
    return decoy.mock(cls=ContextCreator)


@pytest.fixture
def executor(decoy: Decoy) -> PythonExecutor:
    """Get a mock PythonExecutor."""
    return decoy.mock(cls=PythonExecutor)


@pytest.fixture
def subject(
    protocol_file: ProtocolFile,
    file_reader: PythonFileReader,
    context_creator: ContextCreator,
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
    context_creator: ContextCreator,
    protocol_context: ProtocolContext,
    executor: PythonExecutor,
    subject: PythonFileRunner,
) -> None:
    """It should be able to load the module and prepare a ProtocolContext."""
    decoy.when(file_reader.read(protocol_file=protocol_file)).then_return(
        python_protocol
    )
    decoy.when(context_creator.create()).then_return(protocol_context)

    subject.load()

    decoy.verify(executor.load(protocol=python_protocol, context=protocol_context))


async def test_python_runner_play(
    decoy: Decoy,
    executor: PythonExecutor,
    subject: PythonFileRunner,
) -> None:
    """It should be able to start the run."""
    await subject.run()
    decoy.verify(await executor.execute())


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_python_runner_pause(subject: PythonFileRunner) -> None:
    """It should be able to pause the run."""
    subject.pause()


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_python_runner_stop(subject: PythonFileRunner) -> None:
    """It should be able to stop the run."""
    subject.stop()
