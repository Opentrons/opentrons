"""Tests for a JsonFileRunner interface."""
import pytest
from decoy import Decoy

from opentrons.file_runner import JsonFileRunner
from opentrons.file_runner.command_queue_worker import CommandQueueWorker
from opentrons.protocol_engine import ProtocolEngine, WellLocation
from opentrons.protocol_engine.commands import (PickUpTipRequest, AspirateRequest,
                                                DispenseRequest)
from opentrons.protocols import models
from opentrons.protocols.runner.json_proto.command_translator import \
    CommandTranslator


@pytest.fixture
def decoy() -> Decoy:
    """Create a Decoy state container for this test suite."""
    return Decoy()


@pytest.fixture
def protocol_engine(decoy: Decoy) -> ProtocolEngine:
    """Create a protocol engine fixture."""
    return decoy.create_decoy(spec=ProtocolEngine)


@pytest.fixture
def command_translator(decoy: Decoy) -> CommandTranslator:
    """Create a stubbed command translator fixture."""
    return decoy.create_decoy(spec=CommandTranslator)


@pytest.fixture
def command_queue_worker(decoy: Decoy) -> CommandQueueWorker:
    """Create a stubbed command queue worker fixture."""
    return decoy.create_decoy(spec=CommandQueueWorker)


@pytest.fixture
def sample_json_proto(minimal_labware_def: dict) -> dict:
    """JSON protocol fixture."""
    return {
        "schemaVersion": 3,
        "metadata": {},
        "robot": {
            "model": "OT-2 Standard"
        },
        "pipettes": {
            "leftPipetteId": {
                "mount": "left",
                "name": "p300_single"
            }
        },
        "labware": {
            "trashId": {
                "slot": "12",
                "displayName": "Trash",
                "definitionId": "opentrons/opentrons_1_trash_1100ml_fixed/1"
            },
            "tiprack1Id": {
                "slot": "1",
                "displayName": "Opentrons 96 Tip Rack 300 µL",
                "definitionId": "opentrons/opentrons_96_tiprack_300ul/1"
            },
            "wellplate1Id": {
                "slot": "10",
                "displayName": "Corning 96 Well Plate 360 µL Flat",
                "definitionId": "opentrons/corning_96_wellplate_360ul_flat/1"
            }
        },
        "labwareDefinitions": {
            "opentrons/opentrons_1_trash_1100ml_fixed/1": minimal_labware_def,
            "opentrons/opentrons_96_tiprack_300ul/1": minimal_labware_def,
            "opentrons/corning_96_wellplate_360ul_flat/1": minimal_labware_def
        },
        "commands": [
           {
               "command": "pickUpTip",
               "params": {
                   "pipette": "leftPipetteId",
                   "labware": "tiprack1Id",
                   "well": "A1"
               }
           },
           {
               "command": "aspirate",
               "params": {
                   "pipette": "leftPipetteId",
                   "volume": 51,
                   "labware": "wellplate1Id",
                   "well": "B1",
                   "offsetFromBottomMm": 10,
                   "flowRate": 10
               }
           },
           {
               "command": "dispense",
               "params": {
                   "pipette": "leftPipetteId",
                   "volume": 50,
                   "labware": "wellplate1Id",
                   "well": "H1",
                   "offsetFromBottomMm": 1,
                   "flowRate": 50
               }
           },
        ]
    }


@pytest.fixture
def protocol(sample_json_proto: dict) -> models.JsonProtocol:
    """Create a JSON protocol fixture."""
    return models.JsonProtocol.parse_obj(sample_json_proto)


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


def test_json_runner_load_commands_to_engine(
        decoy: Decoy,
        protocol: models.JsonProtocol,
        subject: JsonFileRunner,
        command_translator: CommandTranslator,
        protocol_engine: ProtocolEngine
) -> None:
    """It should send translated commands to protocol engine."""
    mock_cmd1 = PickUpTipRequest(pipetteId="123", labwareId="abc", wellName="def")
    mock_cmd2 = AspirateRequest(volume=321, wellLocation=WellLocation(),
                                pipetteId="123", labwareId="xyz", wellName="def")
    mock_cmd3 = DispenseRequest(volume=321, wellLocation=WellLocation(),
                                pipetteId="123", labwareId="xyz", wellName="def")
    decoy.when(
        command_translator.translate(protocol.commands[0])).then_return([mock_cmd1])
    decoy.when(
        command_translator.translate(protocol.commands[1])).then_return([mock_cmd2])
    decoy.when(
        command_translator.translate(protocol.commands[2])).then_return([mock_cmd3])

    subject.load()

    decoy.verify(protocol_engine.add_command(mock_cmd1),
                 protocol_engine.add_command(mock_cmd2),
                 protocol_engine.add_command(mock_cmd3))
