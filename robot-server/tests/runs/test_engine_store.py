"""Tests for the EngineStore interface."""
from datetime import datetime
from pathlib import Path

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data import get_shared_data_root

from opentrons.types import DeckSlotName
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine import ProtocolEngine, StateSummary, types as pe_types
from opentrons.protocol_runner import ProtocolRunner, ProtocolRunResult
from opentrons.protocol_reader import ProtocolReader, ProtocolSource

from robot_server.protocols import ProtocolResource
from robot_server.runs.engine_store import EngineStore, EngineConflictError


@pytest.fixture
def subject(decoy: Decoy) -> EngineStore:
    """Get a EngineStore test subject."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=HardwareControlAPI)
    return EngineStore(hardware_api=hardware_api)


@pytest.fixture
async def protocol_source(tmp_path: Path) -> ProtocolSource:
    """Get a protocol source fixture."""
    simple_protocol = (
        get_shared_data_root() / "protocol" / "fixtures" / "6" / "simpleV6.json"
    )
    return await ProtocolReader().read_saved(files=[simple_protocol], directory=None)


async def test_create_engine(subject: EngineStore) -> None:
    """It should create an engine for a run."""
    result = await subject.create(run_id="run-id", labware_offsets=[], protocol=None)

    assert subject.current_run_id == "run-id"
    assert isinstance(result, StateSummary)
    assert isinstance(subject.runner, ProtocolRunner)
    assert isinstance(subject.engine, ProtocolEngine)


async def test_create_engine_with_labware_offsets(subject: EngineStore) -> None:
    """It should create an engine for a run with labware offsets."""
    labware_offset = pe_types.LabwareOffsetCreate(
        definitionUri="namespace/load_name/version",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )

    result = await subject.create(
        run_id="run-id",
        labware_offsets=[labware_offset],
        protocol=None,
    )

    assert result.labwareOffsets == [
        pe_types.LabwareOffset.construct(
            id=matchers.IsA(str),
            createdAt=matchers.IsA(datetime),
            definitionUri="namespace/load_name/version",
            location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
            vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
        )
    ]


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
async def test_create_engine_with_protocol(
    subject: EngineStore,
    protocol_source: ProtocolSource,
) -> None:
    """It should create an engine for a run with labware offsets."""
    # TODO(mc, 2022-05-18): https://github.com/Opentrons/opentrons/pull/10170
    raise NotImplementedError("Implement this test when JSONv6 runs are supported")

    protocol = ProtocolResource(
        protocol_id="my cool protocol",
        protocol_key=None,
        created_at=datetime(year=2021, month=1, day=1),
        source=protocol_source,
    )

    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        protocol=protocol,
    )


async def test_archives_state_if_engine_already_exists(subject: EngineStore) -> None:
    """It should not create more than one engine / runner pair."""
    await subject.create(run_id="run-id-1", labware_offsets=[], protocol=None)

    with pytest.raises(EngineConflictError):
        await subject.create(run_id="run-id-2", labware_offsets=[], protocol=None)

    assert subject.current_run_id == "run-id-1"


async def test_clear_engine(subject: EngineStore) -> None:
    """It should clear a stored engine entry."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
    await subject.runner.run()
    result = await subject.clear()

    assert subject.current_run_id is None
    assert isinstance(result, ProtocolRunResult)

    with pytest.raises(AssertionError):
        subject.engine

    with pytest.raises(AssertionError):
        subject.runner


async def test_clear_engine_not_stopped_or_idle(subject: EngineStore) -> None:
    """It should raise a conflict if the engine is not stopped."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
    subject.runner.play()

    with pytest.raises(EngineConflictError):
        await subject.clear()


async def test_clear_idle_engine(subject: EngineStore) -> None:
    """It should successfully clear engine if idle (not started)."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
    assert subject.engine is not None
    assert subject.runner is not None

    await subject.clear()

    # TODO: test engine finish is called
    with pytest.raises(AssertionError):
        subject.engine
    with pytest.raises(AssertionError):
        subject.runner


async def test_get_default_engine(subject: EngineStore) -> None:
    """It should create and retrieve a default ProtocolEngine."""
    result = await subject.get_default_engine()
    repeated_result = await subject.get_default_engine()

    assert isinstance(result, ProtocolEngine)
    assert repeated_result is result


async def test_get_default_engine_current_unstarted(subject: EngineStore) -> None:
    """It should allow a default engine if another engine current but unstarted."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)

    result = await subject.get_default_engine()
    assert isinstance(result, ProtocolEngine)


async def test_get_default_engine_conflict(subject: EngineStore) -> None:
    """It should not allow a default engine if another engine is executing commands."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
    subject.engine.play()

    with pytest.raises(EngineConflictError):
        await subject.get_default_engine()


async def test_get_default_engine_run_stopped(subject: EngineStore) -> None:
    """It allow a default engine if another engine is terminal."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
    await subject.engine.finish()

    result = await subject.get_default_engine()
    assert isinstance(result, ProtocolEngine)
