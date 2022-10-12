"""Tests for the ProtocolRunner class."""
import pytest
from decoy import Decoy, matchers
from pathlib import Path
from typing import List, cast, AsyncGenerator

from opentrons_shared_data.protocol.dev_types import (
    JsonProtocol as LegacyJsonProtocolDict,
)
from opentrons.broker import Broker
from opentrons.equipment_broker import EquipmentBroker
from opentrons.hardware_control import API as HardwareAPI
from opentrons.config import feature_flags
from opentrons.protocols.api_support.types import APIVersion
from opentrons_shared_data.protocol.models.protocol_schema_v6 import ProtocolSchemaV6
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons.protocol_api_experimental import ProtocolContext
from opentrons.protocol_engine import ProtocolEngine, Liquid, commands as pe_commands
from opentrons.protocol_reader import (
    ProtocolSource,
    JsonProtocolConfig,
    PythonProtocolConfig,
)
from opentrons.protocol_runner import ProtocolRunner
from opentrons.protocol_runner.task_queue import TaskQueue
from opentrons.protocol_runner.json_file_reader import JsonFileReader
from opentrons.protocol_runner.json_translator import JsonTranslator
from opentrons.protocol_runner.python_file_reader import (
    PythonFileReader,
    PythonProtocol,
)
from opentrons.protocol_runner.python_context_creator import PythonContextCreator
from opentrons.protocol_runner.python_executor import PythonExecutor
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
def python_file_reader(decoy: Decoy) -> PythonFileReader:
    """Get a mocked out PythonFileReader dependency."""
    return decoy.mock(cls=PythonFileReader)


@pytest.fixture
def python_context_creator(decoy: Decoy) -> PythonContextCreator:
    """Get a mocked out PythonContextCreator dependency."""
    return decoy.mock(cls=PythonContextCreator)


@pytest.fixture
def python_executor(decoy: Decoy) -> PythonExecutor:
    """Get a mocked out PythonExecutor dependency."""
    return decoy.mock(cls=PythonExecutor)


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


@pytest.fixture
def subject(
    protocol_engine: ProtocolEngine,
    hardware_api: HardwareAPI,
    task_queue: TaskQueue,
    json_file_reader: JsonFileReader,
    json_translator: JsonTranslator,
    python_file_reader: PythonFileReader,
    python_context_creator: PythonContextCreator,
    python_executor: PythonExecutor,
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
        python_file_reader=python_file_reader,
        python_context_creator=python_context_creator,
        python_executor=python_executor,
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


def test_load_json(
    decoy: Decoy,
    json_file_reader: JsonFileReader,
    json_translator: JsonTranslator,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    subject: ProtocolRunner,
    enable_load_liquid: AsyncGenerator[None, None],
) -> None:
    """It should load a JSON protocol file."""
    json_protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.json"),
        files=[],
        metadata={},
        config=JsonProtocolConfig(schema_version=6),
        labware_definitions=[],
    )

    json_protocol = ProtocolSchemaV6.construct()  # type: ignore[call-arg]

    commands: List[pe_commands.CommandCreate] = [
        pe_commands.WaitForResumeCreate(
            params=pe_commands.WaitForResumeParams(message="hello")
        ),
        pe_commands.WaitForResumeCreate(
            params=pe_commands.WaitForResumeParams(message="goodbye")
        ),
    ]

    liquids: List[Liquid] = [
        Liquid(id="water-id", displayName="water", description=" water desc")
    ]

    decoy.when(json_file_reader.read(json_protocol_source)).then_return(json_protocol)
    decoy.when(json_translator.translate_commands(json_protocol)).then_return(commands)
    decoy.when(json_translator.translate_liquids(json_protocol)).then_return(liquids)

    subject.load(json_protocol_source)

    decoy.verify(
        protocol_engine.add_liquid(
            liquid=Liquid(id="water-id", displayName="water", description=" water desc")
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
        task_queue.set_run_func(func=protocol_engine.wait_until_complete),
    )


def test_load_python(
    decoy: Decoy,
    python_file_reader: PythonFileReader,
    python_context_creator: PythonContextCreator,
    python_executor: PythonExecutor,
    protocol_engine: ProtocolEngine,
    task_queue: TaskQueue,
    subject: ProtocolRunner,
) -> None:
    """It should load a Python protocol file."""
    python_protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.py"),
        files=[],
        metadata={},
        config=PythonProtocolConfig(api_version=APIVersion(3, 0)),
        labware_definitions=[],
    )

    python_protocol = decoy.mock(cls=PythonProtocol)
    protocol_context = decoy.mock(cls=ProtocolContext)

    decoy.when(python_file_reader.read(python_protocol_source)).then_return(
        python_protocol
    )
    decoy.when(python_context_creator.create(protocol_engine)).then_return(
        protocol_context
    )

    subject.load(python_protocol_source)

    decoy.verify(
        task_queue.set_run_func(
            func=python_executor.execute,
            protocol=python_protocol,
            context=protocol_context,
        ),
    )


def test_load_legacy_python(
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
        config=PythonProtocolConfig(api_version=APIVersion(2, 11)),
        labware_definitions=[labware_definition],
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

    decoy.when(legacy_file_reader.read(legacy_protocol_source)).then_return(
        legacy_protocol
    )
    decoy.when(
        legacy_context_creator.create(
            protocol=legacy_protocol,
            broker=matchers.IsA(Broker),
            equipment_broker=matchers.IsA(EquipmentBroker),
        )
    ).then_return(legacy_context)

    subject.load(legacy_protocol_source)

    decoy.verify(
        protocol_engine.add_labware_definition(labware_definition),
        protocol_engine.add_plugin(matchers.IsA(LegacyContextPlugin)),
        task_queue.set_run_func(
            func=legacy_executor.execute,
            protocol=legacy_protocol,
            context=legacy_context,
        ),
    )


# TODO(mc, 2022-08-30): remove enableProtocolEnginePAPICore FF
# to promote feature to production
def test_load_legacy_python_with_pe_papi_core(
    decoy: Decoy,
    legacy_file_reader: LegacyFileReader,
    legacy_context_creator: LegacyContextCreator,
    protocol_engine: ProtocolEngine,
    mock_feature_flags: None,
    subject: ProtocolRunner,
) -> None:
    """It should load a legacy context-based Python protocol."""
    legacy_protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.py"),
        files=[],
        metadata={},
        config=PythonProtocolConfig(api_version=APIVersion(2, 11)),
        labware_definitions=[],
    )

    legacy_protocol = LegacyPythonProtocol(
        text="",
        contents="",
        filename="protocol.py",
        api_level=APIVersion(2, 11),
        metadata={"foo": "bar"},
        bundled_labware=None,
        bundled_data=None,
        bundled_python=None,
        extra_labware=None,
    )

    legacy_context = decoy.mock(cls=LegacyProtocolContext)

    decoy.when(feature_flags.enable_protocol_engine_papi_core()).then_return(True)

    decoy.when(legacy_file_reader.read(legacy_protocol_source)).then_return(
        legacy_protocol
    )
    decoy.when(
        legacy_context_creator.create(
            protocol=legacy_protocol, broker=None, equipment_broker=None
        )
    ).then_return(legacy_context)

    subject.load(legacy_protocol_source)

    decoy.verify(protocol_engine.add_plugin(matchers.IsA(LegacyContextPlugin)), times=0)


def test_load_legacy_json(
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
        config=JsonProtocolConfig(schema_version=5),
        labware_definitions=[labware_definition],
    )

    legacy_protocol = LegacyJsonProtocol(
        text="{}",
        contents=cast(LegacyJsonProtocolDict, {}),
        filename="protocol.json",
        api_level=APIVersion(2, 11),
        schema_version=5,
        metadata={"foo": "bar"},
    )

    legacy_context = decoy.mock(cls=LegacyProtocolContext)

    decoy.when(legacy_file_reader.read(legacy_protocol_source)).then_return(
        legacy_protocol
    )
    decoy.when(
        legacy_context_creator.create(
            legacy_protocol,
            broker=matchers.IsA(Broker),
            equipment_broker=matchers.IsA(EquipmentBroker),
        )
    ).then_return(legacy_context)

    subject.load(legacy_protocol_source)

    decoy.verify(
        protocol_engine.add_labware_definition(labware_definition),
        protocol_engine.add_plugin(matchers.IsA(LegacyContextPlugin)),
        task_queue.set_run_func(
            func=legacy_executor.execute,
            protocol=legacy_protocol,
            context=legacy_context,
        ),
    )
