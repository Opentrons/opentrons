"""Tests for the ProtocolRunner class."""
import pytest
from decoy import Decoy, matchers
from pathlib import Path
from typing import List, cast

from opentrons_shared_data.protocol.dev_types import (
    JsonProtocol as LegacyJsonProtocolDict,
)
from opentrons.broker import Broker
from opentrons.equipment_broker import EquipmentBroker
from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocols.api_support.types import APIVersion
from opentrons_shared_data.protocol.models.protocol_schema_v6 import ProtocolSchemaV6
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons.protocol_engine import ProtocolEngine, Liquid, commands as pe_commands
from opentrons import protocol_reader
from opentrons.protocol_reader import (
    ProtocolSource,
    JsonProtocolConfig,
    PythonProtocolConfig,
)
from opentrons.protocol_runner import ProtocolRunner
from opentrons.protocol_runner.task_queue import TaskQueue
from opentrons.protocol_runner.json_file_reader import JsonFileReader
from opentrons.protocol_runner.json_translator import JsonTranslator
from opentrons.protocol_runner.legacy_context_plugin import LegacyContextPlugin
from opentrons.protocol_runner.legacy_wrappers import (
    LegacyFileReader,
    LegacyContextCreator,
    LegacyExecutor,
    LegacyPythonProtocol,
    LegacyJsonProtocol,
    LegacyProtocolContext,
    LegacyLabwareDefinition,
)


@pytest.fixture
def protocol_engine(decoy: Decoy) -> ProtocolEngine:
    """Get a mocked out ProtocolEngine dependency."""
    return decoy.mock(cls=ProtocolEngine)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mocked out HardwareAPI dependency."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def task_queue(decoy: Decoy) -> TaskQueue:
    """Get a mocked out TaskQueue dependency."""
    return decoy.mock(cls=TaskQueue)


@pytest.fixture
def json_file_reader(decoy: Decoy) -> JsonFileReader:
    """Get a mocked out JsonFileReader dependency."""
    return decoy.mock(cls=JsonFileReader)


@pytest.fixture
def json_translator(decoy: Decoy) -> JsonTranslator:
    """Get a mocked out JsonTranslator dependency."""
    return decoy.mock(cls=JsonTranslator)


@pytest.fixture
def legacy_file_reader(decoy: Decoy) -> LegacyFileReader:
    """Get a mocked out LegacyFileReader dependency."""
    return decoy.mock(cls=LegacyFileReader)


@pytest.fixture
def legacy_context_creator(decoy: Decoy) -> LegacyContextCreator:
    """Get a mocked out LegacyContextCreator dependency."""
    return decoy.mock(cls=LegacyContextCreator)


@pytest.fixture
def legacy_executor(decoy: Decoy) -> LegacyExecutor:
    """Get a mocked out LegacyExecutor dependency."""
    return decoy.mock(cls=LegacyExecutor)


@pytest.fixture(autouse=True)
def use_mock_extract_labware_definitions(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace protocol_reader.extract_labware_definitions() with a Decoy mock."""
    monkeypatch.setattr(
        protocol_reader,
        "extract_labware_definitions",
        decoy.mock(func=protocol_reader.extract_labware_definitions),
    )


@pytest.fixture
def subject(
    protocol_engine: ProtocolEngine,
    hardware_api: HardwareAPI,
    task_queue: TaskQueue,
    json_file_reader: JsonFileReader,
    json_translator: JsonTranslator,
    legacy_file_reader: LegacyFileReader,
    legacy_context_creator: LegacyContextCreator,
    legacy_executor: LegacyExecutor,
) -> ProtocolRunner:
    """Get a ProtocolRunner test subject with mocked dependencies."""
    return ProtocolRunner(
        protocol_engine=protocol_engine,
        hardware_api=hardware_api,
        task_queue=task_queue,
        json_file_reader=json_file_reader,
        json_translator=json_translator,
        legacy_file_reader=legacy_file_reader,
        legacy_context_creator=legacy_context_creator,
        legacy_executor=legacy_executor,
    )


async def test_play_starts_run(
    decoy: Decoy,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    subject: ProtocolRunner,
) -> None:
    """It should start a protocol run with play."""
    subject.play()

    decoy.verify(protocol_engine.play(), times=1)


async def test_pause(
    decoy: Decoy,
    protocol_engine: ProtocolEngine,
    subject: ProtocolRunner,
) -> None:
    """It should pause a protocol run with pause."""
    subject.pause()

    decoy.verify(protocol_engine.pause(), times=1)


async def test_stop(
    decoy: Decoy,
    task_queue: TaskQueue,
    protocol_engine: ProtocolEngine,
    subject: ProtocolRunner,
) -> None:
    """It should halt a protocol run with stop."""
    decoy.when(protocol_engine.state_view.commands.has_been_played()).then_return(True)

    subject.play()
    await subject.stop()

    decoy.verify(await protocol_engine.stop(), times=1)


async def test_stop_never_started(
    decoy: Decoy,
    task_queue: TaskQueue,
    protocol_engine: ProtocolEngine,
    subject: ProtocolRunner,
) -> None:
    """It should clean up rather than halt if the runner was never started."""
    decoy.when(protocol_engine.state_view.commands.has_been_played()).then_return(False)

    await subject.stop()

    decoy.verify(
        await protocol_engine.finish(drop_tips_and_home=False, set_run_status=False),
        times=1,
    )


async def test_run(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    subject: ProtocolRunner,
) -> None:
    """It should run a protocol to completion."""
    decoy.when(protocol_engine.state_view.commands.has_been_played()).then_return(
        False, True
    )

    assert subject.was_started() is False
    await subject.run()
    assert subject.was_started() is True

    decoy.verify(
        await hardware_api.home(),
        protocol_engine.play(),
        task_queue.start(),
        await task_queue.join(),
    )


async def test_load_json(
    decoy: Decoy,
    json_file_reader: JsonFileReader,
    json_translator: JsonTranslator,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    subject: ProtocolRunner,
) -> None:
    """It should load a JSON protocol file."""
    labware_definition = LabwareDefinition.construct()  # type: ignore[call-arg]

    json_protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.json"),
        files=[],
        metadata={},
        robot_type="OT-2 Standard",
        config=JsonProtocolConfig(schema_version=6),
        content_hash="abc123",
    )

    json_protocol = ProtocolSchemaV6.construct()  # type: ignore[call-arg]

    commands: List[pe_commands.CommandCreate] = [
        pe_commands.WaitForResumeCreate(
            params=pe_commands.WaitForResumeParams(message="hello")
        ),
        pe_commands.WaitForResumeCreate(
            params=pe_commands.WaitForResumeParams(message="goodbye")
        ),
        pe_commands.LoadLiquidCreate(
            params=pe_commands.LoadLiquidParams(
                liquidId="water-id", labwareId="labware-id", volumeByWell={"A1": 30}
            )
        ),
    ]

    liquids: List[Liquid] = [
        Liquid(id="water-id", displayName="water", description=" water desc")
    ]

    decoy.when(
        await protocol_reader.extract_labware_definitions(json_protocol_source)
    ).then_return([labware_definition])
    decoy.when(json_file_reader.read(json_protocol_source)).then_return(json_protocol)
    decoy.when(json_translator.translate_commands(json_protocol)).then_return(commands)
    decoy.when(json_translator.translate_liquids(json_protocol)).then_return(liquids)

    await subject.load(json_protocol_source)

    decoy.verify(
        protocol_engine.add_labware_definition(labware_definition),
        protocol_engine.add_command(
            request=pe_commands.WaitForResumeCreate(
                params=pe_commands.WaitForResumeParams(message="hello")
            )
        ),
        protocol_engine.add_command(
            request=pe_commands.WaitForResumeCreate(
                params=pe_commands.WaitForResumeParams(message="goodbye")
            )
        ),
        protocol_engine.add_command(
            request=pe_commands.LoadLiquidCreate(
                params=pe_commands.LoadLiquidParams(
                    liquidId="water-id", labwareId="labware-id", volumeByWell={"A1": 30}
                )
            ),
        ),
        task_queue.set_run_func(func=protocol_engine.wait_until_complete),
    )


async def test_load_json_liquids_ff_on(
    decoy: Decoy,
    json_file_reader: JsonFileReader,
    json_translator: JsonTranslator,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    subject: ProtocolRunner,
) -> None:
    """It should load a JSON protocol file."""
    labware_definition = LabwareDefinition.construct()  # type: ignore[call-arg]

    json_protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.json"),
        files=[],
        metadata={},
        robot_type="OT-2 Standard",
        config=JsonProtocolConfig(schema_version=6),
        content_hash="abc123",
    )

    json_protocol = ProtocolSchemaV6.construct()  # type: ignore[call-arg]

    commands: List[pe_commands.CommandCreate] = [
        pe_commands.LoadLiquidCreate(
            params=pe_commands.LoadLiquidParams(
                liquidId="water-id", labwareId="labware-id", volumeByWell={"A1": 30}
            )
        ),
    ]

    liquids: List[Liquid] = [
        Liquid(id="water-id", displayName="water", description="water desc")
    ]

    decoy.when(
        await protocol_reader.extract_labware_definitions(json_protocol_source)
    ).then_return([labware_definition])
    decoy.when(json_file_reader.read(json_protocol_source)).then_return(json_protocol)
    decoy.when(json_translator.translate_commands(json_protocol)).then_return(commands)
    decoy.when(json_translator.translate_liquids(json_protocol)).then_return(liquids)

    await subject.load(json_protocol_source)

    decoy.verify(
        protocol_engine.add_labware_definition(labware_definition),
        protocol_engine.add_liquid(
            id="water-id", name="water", description="water desc", color=None
        ),
        protocol_engine.add_command(
            request=pe_commands.LoadLiquidCreate(
                params=pe_commands.LoadLiquidParams(
                    liquidId="water-id", labwareId="labware-id", volumeByWell={"A1": 30}
                )
            ),
        ),
        task_queue.set_run_func(func=protocol_engine.wait_until_complete),
    )


async def test_load_legacy_python(
    decoy: Decoy,
    legacy_file_reader: LegacyFileReader,
    legacy_context_creator: LegacyContextCreator,
    legacy_executor: LegacyExecutor,
    task_queue: TaskQueue,
    protocol_engine: ProtocolEngine,
    subject: ProtocolRunner,
) -> None:
    """It should load a legacy context-based Python protocol."""
    labware_definition = LabwareDefinition.construct()  # type: ignore[call-arg]

    legacy_protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.py"),
        files=[],
        metadata={},
        robot_type="OT-2 Standard",
        config=PythonProtocolConfig(api_version=APIVersion(2, 11)),
        content_hash="abc123",
    )

    extra_labware = {"definition-uri": cast(LegacyLabwareDefinition, {})}

    legacy_protocol = LegacyPythonProtocol(
        text="",
        contents="",
        filename="protocol.py",
        api_level=APIVersion(2, 11),
        metadata={"foo": "bar"},
        bundled_labware=None,
        bundled_data=None,
        bundled_python=None,
        extra_labware=extra_labware,
    )

    legacy_context = decoy.mock(cls=LegacyProtocolContext)

    decoy.when(
        await protocol_reader.extract_labware_definitions(legacy_protocol_source)
    ).then_return([labware_definition])
    decoy.when(
        legacy_file_reader.read(
            protocol_source=legacy_protocol_source,
            labware_definitions=[labware_definition],
        )
    ).then_return(legacy_protocol)
    decoy.when(
        legacy_context_creator.create(
            protocol=legacy_protocol,
            broker=matchers.IsA(Broker),
            equipment_broker=matchers.IsA(EquipmentBroker),
        )
    ).then_return(legacy_context)

    await subject.load(legacy_protocol_source)

    decoy.verify(
        protocol_engine.add_labware_definition(labware_definition),
        protocol_engine.add_plugin(matchers.IsA(LegacyContextPlugin)),
        task_queue.set_run_func(
            func=legacy_executor.execute,
            protocol=legacy_protocol,
            context=legacy_context,
        ),
    )


async def test_load_python_with_pe_papi_core(
    decoy: Decoy,
    legacy_file_reader: LegacyFileReader,
    legacy_context_creator: LegacyContextCreator,
    protocol_engine: ProtocolEngine,
    subject: ProtocolRunner,
) -> None:
    """It should load a legacy context-based Python protocol."""
    legacy_protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.py"),
        files=[],
        metadata={},
        robot_type="OT-2 Standard",
        config=PythonProtocolConfig(api_version=APIVersion(2, 14)),
        content_hash="abc123",
    )

    legacy_protocol = LegacyPythonProtocol(
        text="",
        contents="",
        filename="protocol.py",
        api_level=APIVersion(2, 14),
        metadata={"foo": "bar"},
        bundled_labware=None,
        bundled_data=None,
        bundled_python=None,
        extra_labware=None,
    )

    legacy_context = decoy.mock(cls=LegacyProtocolContext)

    decoy.when(
        await protocol_reader.extract_labware_definitions(legacy_protocol_source)
    ).then_return([])
    decoy.when(
        legacy_file_reader.read(
            protocol_source=legacy_protocol_source, labware_definitions=[]
        )
    ).then_return(legacy_protocol)
    decoy.when(
        legacy_context_creator.create(
            protocol=legacy_protocol, broker=None, equipment_broker=None
        )
    ).then_return(legacy_context)

    await subject.load(legacy_protocol_source)

    decoy.verify(protocol_engine.add_plugin(matchers.IsA(LegacyContextPlugin)), times=0)


async def test_load_legacy_json(
    decoy: Decoy,
    legacy_file_reader: LegacyFileReader,
    legacy_context_creator: LegacyContextCreator,
    legacy_executor: LegacyExecutor,
    task_queue: TaskQueue,
    protocol_engine: ProtocolEngine,
    subject: ProtocolRunner,
) -> None:
    """It should load a legacy context-based JSON protocol."""
    labware_definition = LabwareDefinition.construct()  # type: ignore[call-arg]

    legacy_protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.json"),
        files=[],
        metadata={},
        robot_type="OT-2 Standard",
        config=JsonProtocolConfig(schema_version=5),
        content_hash="abc123",
    )

    legacy_protocol = LegacyJsonProtocol(
        text="{}",
        contents=cast(LegacyJsonProtocolDict, {}),
        filename="protocol.json",
        api_level=APIVersion(2, 11),
        schema_version=5,
        metadata={"protocolName": "A Very Impressive Protocol"},
    )

    legacy_context = decoy.mock(cls=LegacyProtocolContext)

    decoy.when(
        await protocol_reader.extract_labware_definitions(legacy_protocol_source)
    ).then_return([labware_definition])
    decoy.when(
        legacy_file_reader.read(
            protocol_source=legacy_protocol_source,
            labware_definitions=[labware_definition],
        )
    ).then_return(legacy_protocol)
    decoy.when(
        legacy_context_creator.create(
            legacy_protocol,
            broker=matchers.IsA(Broker),
            equipment_broker=matchers.IsA(EquipmentBroker),
        )
    ).then_return(legacy_context)

    await subject.load(legacy_protocol_source)

    decoy.verify(
        protocol_engine.add_labware_definition(labware_definition),
        protocol_engine.add_plugin(matchers.IsA(LegacyContextPlugin)),
        task_queue.set_run_func(
            func=legacy_executor.execute,
            protocol=legacy_protocol,
            context=legacy_context,
        ),
    )
