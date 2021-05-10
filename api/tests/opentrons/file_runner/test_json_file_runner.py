"""Tests for a JsonFileRunner interface."""
import pytest
from decoy import Decoy

from opentrons.file_runner import JsonFileRunner
from opentrons.file_runner.command_queue_worker import CommandQueueWorker
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocols import models
from opentrons.protocols.runner.json_proto.command_translator import \
    CommandTranslator


@pytest.fixture
def decoy() -> Decoy:
    return Decoy()


@pytest.fixture
def protocol_engine(decoy: Decoy) -> ProtocolEngine:
    """Create a protocol engine fixture"""
    return decoy.create_decoy(spec=ProtocolEngine)


@pytest.fixture
def command_translator(decoy: Decoy) -> CommandTranslator:
    """Create a command translator fixture"""
    return decoy.create_decoy(spec=CommandTranslator)


@pytest.fixture
def command_queue_worker(decoy: Decoy) -> CommandQueueWorker:
    """Create a command translator fixture"""
    return decoy.create_decoy(spec=CommandQueueWorker)


@pytest.fixture
def protocol(get_json_protocol_fixture) -> models.JsonProtocol:
    """Create a json protocol fixture."""
    fx = get_json_protocol_fixture(
        fixture_version="3", fixture_name="testAllAtomicSingleV3", decode=True
    )
    return models.JsonProtocol.parse_obj(fx)


@pytest.fixture
def subject(
        protocol: models.JsonProtocol,
        protocol_engine: ProtocolEngine,
        command_translator: CommandTranslator,
        command_queue_worker: CommandQueueWorker
) -> JsonFileRunner:
    """Get a JsonFileRunner test subject."""
    return JsonFileRunner(
        protocol=protocol,
        protocol_engine=protocol_engine,
        command_translator=command_translator,
        command_queue_worker=command_queue_worker,
    )


def test_json_runner_play(
        decoy: Decoy, subject: JsonFileRunner, command_queue_worker: CommandQueueWorker
) -> None:
    """It should be able to start the run."""
    subject.play()

    decoy.verify(command_queue_worker.play())


def test_json_runner_pause(
        decoy: Decoy, subject: JsonFileRunner, command_queue_worker: CommandQueueWorker
) -> None:
    """It should be able to pause the run."""
    subject.pause()

    decoy.verify(command_queue_worker.pause())


def test_json_runner_stop(
        decoy: Decoy, subject: JsonFileRunner, command_queue_worker: CommandQueueWorker
) -> None:
    """It should be able to stop the run."""
    subject.stop()

    decoy.verify(command_queue_worker.stop())
