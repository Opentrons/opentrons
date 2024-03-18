"""Protocol run control and management."""
import asyncio
from typing import List, NamedTuple, Optional, Union

from abc import ABC, abstractmethod

import anyio

from opentrons.hardware_control import HardwareControlAPI
from opentrons import protocol_reader
from opentrons.legacy_broker import LegacyBroker
from opentrons.protocol_reader import (
    ProtocolSource,
    JsonProtocolConfig,
    PythonProtocolConfig,
)
from opentrons.protocol_engine import (
    ProtocolEngine,
    StateSummary,
    Command,
    commands as pe_commands,
)
from opentrons.protocols.parse import PythonParseMode
from opentrons.util.broker import Broker

from .task_queue import TaskQueue
from .json_file_reader import JsonFileReader
from .json_translator import JsonTranslator
from .legacy_context_plugin import LegacyContextPlugin
from .legacy_wrappers import (
    LEGACY_PYTHON_API_VERSION_CUTOFF,
    LEGACY_JSON_SCHEMA_VERSION_CUTOFF,
    LegacyFileReader,
    LegacyContextCreator,
    LegacyExecutor,
    LegacyLoadInfo,
)
from ..protocol_engine.types import PostRunHardwareState, DeckConfigurationType, \
    RTPOverridesType


class RunResult(NamedTuple):
    """Result data from a run, pulled from the ProtocolEngine."""

    commands: List[Command]
    state_summary: StateSummary


class AbstractRunner(ABC):
    """An interface to manage and control a protocol run.

    A Runner is primarily responsible for feeding a ProtocolEngine
    with commands and control signals. These commands and signals are
    generated by protocol files, hardware signals, or externally via
    the HTTP robot-server.

    A Runner controls a single run. Once the run is finished,
    you will need a new Runner to do another run.
    """

    def __init__(self, protocol_engine: ProtocolEngine) -> None:
        self._protocol_engine = protocol_engine
        self._broker = LegacyBroker()

    # TODO(mm, 2023-10-03): `LegacyBroker` is specific to Python protocols and JSON protocols ≤v5.
    # We'll need to extend this in order to report progress from newer JSON protocols.
    #
    # TODO(mm, 2023-10-04): When we switch this to return a new `Broker` instead of a
    # `LegacyBroker`, we should annotate the return type as a `ReadOnlyBroker`.
    @property
    def broker(self) -> LegacyBroker:
        """Return a broker that you can subscribe to in order to monitor protocol progress.

        Currently, this only returns messages for `PythonAndLegacyRunner`.
        Otherwise, it's a no-op.
        """
        return self._broker

    def was_started(self) -> bool:
        """Whether the run has been started.

        This value is latched; once it is True, it will never become False.
        """
        return self._protocol_engine.state_view.commands.has_been_played()

    def play(self, deck_configuration: Optional[DeckConfigurationType] = None) -> None:
        """Start or resume the run."""
        self._protocol_engine.play(deck_configuration=deck_configuration)

    def pause(self) -> None:
        """Pause the run."""
        self._protocol_engine.pause()

    async def stop(self) -> None:
        """Stop (cancel) the run."""
        if self.was_started():
            await self._protocol_engine.stop()
        else:
            await self._protocol_engine.finish(
                drop_tips_after_run=False,
                set_run_status=False,
                post_run_hardware_state=PostRunHardwareState.STAY_ENGAGED_IN_PLACE,
            )

    @abstractmethod
    async def run(
        self,
        deck_configuration: DeckConfigurationType,
        run_time_params_overrides: Optional[RTPOverridesType],
        protocol_source: Optional[ProtocolSource] = None,
    ) -> RunResult:
        """Run a given protocol to completion."""


class PythonAndLegacyRunner(AbstractRunner):
    """Protocol runner implementation for Python protocols, and JSON protocols ≤v5."""

    def __init__(
        self,
        protocol_engine: ProtocolEngine,
        hardware_api: HardwareControlAPI,
        task_queue: Optional[TaskQueue] = None,
        legacy_file_reader: Optional[LegacyFileReader] = None,
        legacy_context_creator: Optional[LegacyContextCreator] = None,
        legacy_executor: Optional[LegacyExecutor] = None,
        post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
        drop_tips_after_run: bool = True,
    ) -> None:
        """Initialize the PythonAndLegacyRunner with its dependencies."""
        super().__init__(protocol_engine)
        self._hardware_api = hardware_api
        self._legacy_file_reader = legacy_file_reader or LegacyFileReader()
        self._legacy_context_creator = legacy_context_creator or LegacyContextCreator(
            hardware_api=hardware_api,
            protocol_engine=protocol_engine,
        )
        self._legacy_executor = legacy_executor or LegacyExecutor()
        # TODO(mc, 2022-01-11): replace task queue with specific implementations
        # of runner interface
        self._task_queue = (
            task_queue or TaskQueue()
        )
        self._task_queue.set_cleanup_func(
            func=protocol_engine.finish,
            drop_tips_after_run=drop_tips_after_run,
            post_run_hardware_state=post_run_hardware_state,
        )

    async def load(
        self, protocol_source: ProtocolSource, python_parse_mode: PythonParseMode, run_time_params_overrides: Optional[RTPOverridesType],
    ) -> None:
        """Load a Python or JSONv5(& older) ProtocolSource into managed ProtocolEngine."""
        labware_definitions = await protocol_reader.extract_labware_definitions(
            protocol_source=protocol_source
        )
        for definition in labware_definitions:
            # Assume adding a labware definition is fast and there are not many labware
            # definitions, so we don't need to yield here.
            self._protocol_engine.add_labware_definition(definition)

        # fixme(mm, 2022-12-23): This does I/O and compute-bound parsing that will block
        # the event loop. Jira RSS-165.
        protocol = self._legacy_file_reader.read(
            protocol_source, labware_definitions, python_parse_mode
        )
        equipment_broker = None

        if protocol.api_level < LEGACY_PYTHON_API_VERSION_CUTOFF:
            equipment_broker = Broker[LegacyLoadInfo]()
            self._protocol_engine.add_plugin(
                LegacyContextPlugin(
                    broker=self._broker, equipment_broker=equipment_broker
                )
            )
            self._hardware_api.should_taskify_movement_execution(taskify=True)
        else:
            self._hardware_api.should_taskify_movement_execution(taskify=False)

        context = self._legacy_context_creator.create(
            protocol=protocol,
            broker=self._broker,
            equipment_broker=equipment_broker,
        )
        initial_home_command = pe_commands.HomeCreate(
            params=pe_commands.HomeParams(axes=None)
        )
        # this command homes all axes, including pipette plunger and gripper jaw
        self._protocol_engine.add_command(request=initial_home_command)

        self._task_queue.set_run_func(
            func=self._legacy_executor.execute,
            protocol=protocol,
            context=context,
            run_time_params_overrides=run_time_params_overrides,
        )

    async def run(  # noqa: D102
        self,
        deck_configuration: DeckConfigurationType,
        run_time_params_overrides: Optional[RTPOverridesType],
        protocol_source: Optional[ProtocolSource] = None,
        python_parse_mode: PythonParseMode = PythonParseMode.NORMAL,
    ) -> RunResult:
        # TODO(mc, 2022-01-11): move load to runner creation, remove from `run`
        # currently `protocol_source` arg is only used by tests
        if protocol_source:
            await self.load(
                protocol_source=protocol_source,
                python_parse_mode=python_parse_mode,
                run_time_params_overrides=run_time_params_overrides,
            )

        self.play(deck_configuration=deck_configuration)
        self._task_queue.start()
        await self._task_queue.join()

        run_data = self._protocol_engine.state_view.get_summary()
        commands = self._protocol_engine.state_view.commands.get_all()
        return RunResult(commands=commands, state_summary=run_data)


class JsonRunner(AbstractRunner):
    """Protocol runner implementation for json protocols."""

    def __init__(
        self,
        protocol_engine: ProtocolEngine,
        hardware_api: HardwareControlAPI,
        task_queue: Optional[TaskQueue] = None,
        json_file_reader: Optional[JsonFileReader] = None,
        json_translator: Optional[JsonTranslator] = None,
        post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
        drop_tips_after_run: bool = True,
    ) -> None:
        """Initialize the JsonRunner with its dependencies."""
        super().__init__(protocol_engine)
        self._protocol_engine = protocol_engine
        self._hardware_api = hardware_api
        self._json_file_reader = json_file_reader or JsonFileReader()
        self._json_translator = json_translator or JsonTranslator()
        # TODO(mc, 2022-01-11): replace task queue with specific implementations
        # of runner interface
        self._task_queue = (
            task_queue or TaskQueue()
        )  # cleanup_func=protocol_engine.finish))
        self._task_queue.set_cleanup_func(
            func=protocol_engine.finish,
            drop_tips_after_run=drop_tips_after_run,
            post_run_hardware_state=post_run_hardware_state,
        )

        self._hardware_api.should_taskify_movement_execution(taskify=False)

    async def load(self, protocol_source: ProtocolSource) -> None:
        """Load a JSONv6+ ProtocolSource into managed ProtocolEngine."""
        labware_definitions = await protocol_reader.extract_labware_definitions(
            protocol_source=protocol_source
        )
        for definition in labware_definitions:
            # Assume adding a labware definition is fast and there are not many labware
            # definitions, so we don't need to yield here.
            self._protocol_engine.add_labware_definition(definition)

        protocol = await anyio.to_thread.run_sync(
            self._json_file_reader.read,
            protocol_source,
        )

        commands = await anyio.to_thread.run_sync(
            self._json_translator.translate_commands,
            protocol,
        )

        # Add commands and liquids to the ProtocolEngine.
        #
        # We yield on every iteration so that loading large protocols doesn't block the
        # event loop. With a 24-step 10k-command protocol (See RQA-443), adding all the
        # commands can take 3 to 7 seconds.
        #
        # It wouldn't be safe to do this in a worker thread because each addition
        # invokes the ProtocolEngine's ChangeNotifier machinery, which is not
        # thread-safe.
        liquids = await anyio.to_thread.run_sync(
            self._json_translator.translate_liquids, protocol
        )
        for liquid in liquids:
            self._protocol_engine.add_liquid(
                id=liquid.id,
                name=liquid.displayName,
                description=liquid.description,
                color=liquid.displayColor,
            )
            await _yield()
        initial_home_command = pe_commands.HomeCreate(
            params=pe_commands.HomeParams(axes=None)
        )
        # this command homes all axes, including pipette plugner and gripper jaw
        self._protocol_engine.add_command(request=initial_home_command)

        for command in commands:
            self._protocol_engine.add_command(request=command)
            await _yield()

        self._task_queue.set_run_func(func=self._protocol_engine.wait_until_complete)

    async def run(  # noqa: D102
        self,
        deck_configuration: DeckConfigurationType,
        protocol_source: Optional[ProtocolSource] = None,
        run_time_params_overrides: Optional[RTPOverridesType] = None,
    ) -> RunResult:
        # TODO(mc, 2022-01-11): move load to runner creation, remove from `run`
        # currently `protocol_source` arg is only used by tests
        if protocol_source:
            await self.load(protocol_source)

        self.play(deck_configuration=deck_configuration)
        self._task_queue.start()
        await self._task_queue.join()

        run_data = self._protocol_engine.state_view.get_summary()
        commands = self._protocol_engine.state_view.commands.get_all()
        return RunResult(commands=commands, state_summary=run_data)


class LiveRunner(AbstractRunner):
    """Protocol runner implementation for live http protocols."""

    def __init__(
        self,
        protocol_engine: ProtocolEngine,
        hardware_api: HardwareControlAPI,
        task_queue: Optional[TaskQueue] = None,
    ) -> None:
        """Initialize the LiveRunner with its dependencies."""
        super().__init__(protocol_engine)
        self._protocol_engine = protocol_engine
        # TODO(mc, 2022-01-11): replace task queue with specific implementations
        # of runner interface
        self._hardware_api = hardware_api
        self._task_queue = task_queue or TaskQueue()
        self._task_queue.set_cleanup_func(func=protocol_engine.finish)

        self._hardware_api.should_taskify_movement_execution(taskify=False)

    def prepare(self) -> None:
        """Set the task queue to wait until all commands are executed."""
        self._task_queue.set_run_func(func=self._protocol_engine.wait_until_complete)

    async def run(  # noqa: D102
        self,
        deck_configuration: DeckConfigurationType,
        protocol_source: Optional[ProtocolSource] = None,
        run_time_params_overrides: Optional[RTPOverridesType] = None,
    ) -> RunResult:
        assert protocol_source is None
        await self._hardware_api.home()
        self.play(deck_configuration=deck_configuration)
        self._task_queue.start()
        await self._task_queue.join()

        run_data = self._protocol_engine.state_view.get_summary()
        commands = self._protocol_engine.state_view.commands.get_all()
        return RunResult(commands=commands, state_summary=run_data)


AnyRunner = Union[PythonAndLegacyRunner, JsonRunner, LiveRunner]


def create_protocol_runner(
    protocol_config: Optional[Union[JsonProtocolConfig, PythonProtocolConfig]],
    protocol_engine: ProtocolEngine,
    hardware_api: HardwareControlAPI,
    task_queue: Optional[TaskQueue] = None,
    json_file_reader: Optional[JsonFileReader] = None,
    json_translator: Optional[JsonTranslator] = None,
    legacy_file_reader: Optional[LegacyFileReader] = None,
    legacy_context_creator: Optional[LegacyContextCreator] = None,
    legacy_executor: Optional[LegacyExecutor] = None,
    post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
    drop_tips_after_run: bool = True,
) -> AnyRunner:
    """Create a protocol runner."""
    if protocol_config:
        if (
            isinstance(protocol_config, JsonProtocolConfig)
            and protocol_config.schema_version >= LEGACY_JSON_SCHEMA_VERSION_CUTOFF
        ):
            return JsonRunner(
                protocol_engine=protocol_engine,
                hardware_api=hardware_api,
                json_file_reader=json_file_reader,
                json_translator=json_translator,
                task_queue=task_queue,
                post_run_hardware_state=post_run_hardware_state,
                drop_tips_after_run=drop_tips_after_run,
            )
        else:
            return PythonAndLegacyRunner(
                protocol_engine=protocol_engine,
                hardware_api=hardware_api,
                task_queue=task_queue,
                legacy_file_reader=legacy_file_reader,
                legacy_context_creator=legacy_context_creator,
                legacy_executor=legacy_executor,
                post_run_hardware_state=post_run_hardware_state,
                drop_tips_after_run=drop_tips_after_run,
            )

    return LiveRunner(
        protocol_engine=protocol_engine,
        hardware_api=hardware_api,
        task_queue=task_queue,
    )


async def _yield() -> None:
    """Yield execution to the event loop, giving other tasks a chance to run."""
    await asyncio.sleep(0)
