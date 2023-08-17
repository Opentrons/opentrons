"""Tests for the PythonAndLegacyRunner, JsonRunner & LiveRunner classes."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from decoy import Decoy, matchers
from pathlib import Path
from typing import List, cast, Optional, Union, Type

from opentrons_shared_data.protocol.dev_types import (
    JsonProtocol as LegacyJsonProtocolDict,
)
from opentrons.broker import Broker
from opentrons.equipment_broker import EquipmentBroker
from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocols.api_support.types import APIVersion
from opentrons_shared_data.protocol.models import ProtocolSchemaV6, ProtocolSchemaV7
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons.protocol_engine import ProtocolEngine, Liquid, commands as pe_commands
from opentrons import protocol_reader
from opentrons.protocol_reader import (
    ProtocolSource,
    JsonProtocolConfig,
    PythonProtocolConfig,
)
from opentrons.protocol_runner import (
    create_protocol_runner,
    JsonRunner,
    PythonAndLegacyRunner,
    LiveRunner,
    AnyRunner,
)
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
def json_runner_subject(
    protocol_engine: ProtocolEngine,
    hardware_api: HardwareAPI,
    task_queue: TaskQueue,
    json_file_reader: JsonFileReader,
    json_translator: JsonTranslator,
) -> JsonRunner:
    """Get a JsonRunner test subject with mocked dependencies."""
    return JsonRunner(
        protocol_engine=protocol_engine,
        hardware_api=hardware_api,
        task_queue=task_queue,
        json_file_reader=json_file_reader,
        json_translator=json_translator,
    )


@pytest.fixture
def legacy_python_runner_subject(
    protocol_engine: ProtocolEngine,
    hardware_api: HardwareAPI,
    task_queue: TaskQueue,
    legacy_file_reader: LegacyFileReader,
    legacy_context_creator: LegacyContextCreator,
    legacy_executor: LegacyExecutor,
) -> PythonAndLegacyRunner:
    """Get a PythonAndLegacyRunner test subject with mocked dependencies."""
    return PythonAndLegacyRunner(
        protocol_engine=protocol_engine,
        hardware_api=hardware_api,
        task_queue=task_queue,
        legacy_file_reader=legacy_file_reader,
        legacy_context_creator=legacy_context_creator,
        legacy_executor=legacy_executor,
    )


@pytest.fixture
def live_runner_subject(
    protocol_engine: ProtocolEngine,
    hardware_api: HardwareAPI,
    task_queue: TaskQueue,
) -> LiveRunner:
    """Get a LiveRunner test subject with mocked dependencies."""
    return LiveRunner(
        protocol_engine=protocol_engine,
        hardware_api=hardware_api,
        task_queue=task_queue,
    )


@pytest.mark.parametrize(
    "config, runner_type",
    [
        (JsonProtocolConfig(schema_version=6), JsonRunner),
        (JsonProtocolConfig(schema_version=7), JsonRunner),
        (PythonProtocolConfig(api_version=APIVersion(2, 14)), PythonAndLegacyRunner),
        (JsonProtocolConfig(schema_version=5), PythonAndLegacyRunner),
        (PythonProtocolConfig(api_version=APIVersion(2, 13)), PythonAndLegacyRunner),
        (None, LiveRunner),
    ],
)
async def test_create_protocol_runner(
    protocol_engine: ProtocolEngine,
    hardware_api: HardwareAPI,
    task_queue: TaskQueue,
    json_file_reader: JsonFileReader,
    json_translator: JsonTranslator,
    legacy_file_reader: LegacyFileReader,
    legacy_context_creator: LegacyContextCreator,
    legacy_executor: LegacyExecutor,
    config: Optional[Union[JsonProtocolConfig, PythonProtocolConfig]],
    runner_type: Type[AnyRunner],
) -> None:
    """It should return protocol runner type depending on the config."""
    assert isinstance(
        create_protocol_runner(
            protocol_config=config,
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
            task_queue=task_queue,
            json_file_reader=json_file_reader,
            json_translator=json_translator,
        ),
        runner_type,
    )


@pytest.mark.parametrize(
    "subject",
    [
        (lazy_fixture("json_runner_subject")),
        (lazy_fixture("legacy_python_runner_subject")),
        (lazy_fixture("live_runner_subject")),
    ],
)
async def test_play_starts_run(
    decoy: Decoy,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    subject: AnyRunner,
) -> None:
    """It should start a protocol run with play."""
    subject.play()

    decoy.verify(protocol_engine.play(), times=1)


@pytest.mark.parametrize(
    "subject",
    [
        (lazy_fixture("json_runner_subject")),
        (lazy_fixture("legacy_python_runner_subject")),
        (lazy_fixture("live_runner_subject")),
    ],
)
async def test_pause(
    decoy: Decoy,
    protocol_engine: ProtocolEngine,
    subject: AnyRunner,
) -> None:
    """It should pause a protocol run with pause."""
    subject.pause()

    decoy.verify(protocol_engine.pause(), times=1)


@pytest.mark.parametrize(
    "subject",
    [
        (lazy_fixture("json_runner_subject")),
        (lazy_fixture("legacy_python_runner_subject")),
        (lazy_fixture("live_runner_subject")),
    ],
)
async def test_stop(
    decoy: Decoy,
    task_queue: TaskQueue,
    protocol_engine: ProtocolEngine,
    subject: AnyRunner,
) -> None:
    """It should halt a protocol run with stop."""
    decoy.when(protocol_engine.state_view.commands.has_been_played()).then_return(True)

    subject.play()
    await subject.stop()

    decoy.verify(await protocol_engine.stop(), times=1)


@pytest.mark.parametrize(
    "subject",
    [
        (lazy_fixture("json_runner_subject")),
        (lazy_fixture("legacy_python_runner_subject")),
        (lazy_fixture("live_runner_subject")),
    ],
)
async def test_stop_when_run_never_started(
    decoy: Decoy,
    task_queue: TaskQueue,
    protocol_engine: ProtocolEngine,
    subject: AnyRunner,
) -> None:
    """It should clean up rather than halt if the runner was never started."""
    decoy.when(protocol_engine.state_view.commands.has_been_played()).then_return(False)

    await subject.stop()

    decoy.verify(
        await protocol_engine.finish(drop_tips_and_home=False, set_run_status=False),
        times=1,
    )


async def test_run_json_runner(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    json_runner_subject: JsonRunner,
) -> None:
    """It should run a protocol to completion."""
    decoy.when(protocol_engine.state_view.commands.has_been_played()).then_return(
        False, True
    )

    assert json_runner_subject.was_started() is False
    await json_runner_subject.run()
    assert json_runner_subject.was_started() is True

    decoy.verify(
        protocol_engine.play(),
        task_queue.start(),
        await task_queue.join(),
    )


@pytest.mark.parametrize(
    "schema_version, json_protocol",
    [
        (6, ProtocolSchemaV6.construct()),  # type: ignore[call-arg]
        (7, ProtocolSchemaV7.construct()),  # type: ignore[call-arg]
    ],
)
async def test_load_json_runner(
    decoy: Decoy,
    json_file_reader: JsonFileReader,
    json_translator: JsonTranslator,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    json_runner_subject: JsonRunner,
    schema_version: int,
    json_protocol: Union[ProtocolSchemaV6, ProtocolSchemaV7],
) -> None:
    """It should load a JSON protocol file."""
    labware_definition = LabwareDefinition.construct()  # type: ignore[call-arg]

    json_protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.json"),
        files=[],
        metadata={},
        robot_type="OT-2 Standard",
        config=JsonProtocolConfig(schema_version=schema_version),
        content_hash="abc123",
    )

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
        Liquid(id="water-id", displayName="water", description="water desc")
    ]

    decoy.when(
        await protocol_reader.extract_labware_definitions(json_protocol_source)
    ).then_return([labware_definition])
    decoy.when(json_file_reader.read(json_protocol_source)).then_return(json_protocol)
    decoy.when(json_translator.translate_commands(json_protocol)).then_return(commands)
    decoy.when(json_translator.translate_liquids(json_protocol)).then_return(liquids)

    await json_runner_subject.load(json_protocol_source)

    decoy.verify(
        protocol_engine.add_labware_definition(labware_definition),
        protocol_engine.add_liquid(
            id="water-id", name="water", description="water desc", color=None
        ),
        protocol_engine.add_command(
            request=pe_commands.HomeCreate(params=pe_commands.HomeParams(axes=None))
        ),
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


async def test_load_legacy_python(
    decoy: Decoy,
    legacy_file_reader: LegacyFileReader,
    legacy_context_creator: LegacyContextCreator,
    legacy_executor: LegacyExecutor,
    task_queue: TaskQueue,
    protocol_engine: ProtocolEngine,
    legacy_python_runner_subject: PythonAndLegacyRunner,
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
        robot_type="OT-3 Standard",
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

    await legacy_python_runner_subject.load(legacy_protocol_source)

    decoy.verify(
        protocol_engine.add_labware_definition(labware_definition),
        protocol_engine.add_plugin(matchers.IsA(LegacyContextPlugin)),
        protocol_engine.add_command(
            request=pe_commands.HomeCreate(params=pe_commands.HomeParams(axes=None))
        ),
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
    legacy_python_runner_subject: PythonAndLegacyRunner,
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
        robot_type="OT-3 Standard",
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

    await legacy_python_runner_subject.load(legacy_protocol_source)

    decoy.verify(protocol_engine.add_plugin(matchers.IsA(LegacyContextPlugin)), times=0)


async def test_load_legacy_json(
    decoy: Decoy,
    legacy_file_reader: LegacyFileReader,
    legacy_context_creator: LegacyContextCreator,
    legacy_executor: LegacyExecutor,
    task_queue: TaskQueue,
    protocol_engine: ProtocolEngine,
    legacy_python_runner_subject: PythonAndLegacyRunner,
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
        robot_type="OT-3 Standard",
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

    await legacy_python_runner_subject.load(legacy_protocol_source)

    decoy.verify(
        protocol_engine.add_labware_definition(labware_definition),
        protocol_engine.add_plugin(matchers.IsA(LegacyContextPlugin)),
        protocol_engine.add_command(
            request=pe_commands.HomeCreate(params=pe_commands.HomeParams(axes=None))
        ),
        task_queue.set_run_func(
            func=legacy_executor.execute,
            protocol=legacy_protocol,
            context=legacy_context,
        ),
    )


async def test_run_python_runner(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    legacy_python_runner_subject: PythonAndLegacyRunner,
) -> None:
    """It should run a protocol to completion."""
    decoy.when(protocol_engine.state_view.commands.has_been_played()).then_return(
        False, True
    )

    assert legacy_python_runner_subject.was_started() is False
    await legacy_python_runner_subject.run()
    assert legacy_python_runner_subject.was_started() is True

    decoy.verify(
        protocol_engine.play(),
        task_queue.start(),
        await task_queue.join(),
    )


async def test_run_live_runner(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    live_runner_subject: LiveRunner,
) -> None:
    """It should run a protocol to completion."""
    decoy.when(protocol_engine.state_view.commands.has_been_played()).then_return(
        False, True
    )

    assert live_runner_subject.was_started() is False
    await live_runner_subject.run()
    assert live_runner_subject.was_started() is True

    decoy.verify(
        await hardware_api.home(),
        protocol_engine.play(),
        task_queue.start(),
        await task_queue.join(),
    )
