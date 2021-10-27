"""Protocol run control and management."""
from dataclasses import dataclass
from typing import List, Optional

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import (
    ProtocolEngine,
    Command,
    LoadedLabware,
    LoadedPipette,
)

from .protocol_source import ProtocolSource
from .pre_analysis import JsonPreAnalysis, PythonPreAnalysis
from .task_queue import TaskQueue
from .json_file_reader import JsonFileReader
from .json_command_translator import JsonCommandTranslator
from .python_file_reader import PythonFileReader
from .python_context_creator import PythonContextCreator
from .python_executor import PythonExecutor
from .legacy_context_plugin import LegacyContextPlugin
from .legacy_wrappers import (
    LEGACY_PYTHON_API_VERSION_CUTOFF,
    LEGACY_JSON_SCHEMA_VERSION_CUTOFF,
    LegacyFileReader,
    LegacyContextCreator,
    LegacyExecutor,
)


@dataclass(frozen=True)
class ProtocolRunData:
    """Data from a protocol run."""

    commands: List[Command]
    labware: List[LoadedLabware]
    pipettes: List[LoadedPipette]


class ProtocolRunner:
    """An interface to manage and control a protocol run.

    The ProtocolRunner is primarily responsible for feeding a ProtocolEngine
    with commands and control signals. These commands and signals are
    generated by protocol files, hardware signals, or externally via
    the HTTP robot-server.

    A ProtocolRunner controls a single run. Once the run is finished,
    you will need a new ProtocolRunner to do another run.
    """

    def __init__(
        self,
        protocol_engine: ProtocolEngine,
        hardware_api: HardwareAPI,
        task_queue: Optional[TaskQueue] = None,
        json_file_reader: Optional[JsonFileReader] = None,
        json_command_translator: Optional[JsonCommandTranslator] = None,
        python_file_reader: Optional[PythonFileReader] = None,
        python_context_creator: Optional[PythonContextCreator] = None,
        python_executor: Optional[PythonExecutor] = None,
        legacy_file_reader: Optional[LegacyFileReader] = None,
        legacy_context_creator: Optional[LegacyContextCreator] = None,
        legacy_executor: Optional[LegacyExecutor] = None,
    ) -> None:
        """Initialize the ProtocolRunner with its dependencies."""
        self._protocol_engine = protocol_engine
        self._hardware_api = hardware_api
        self._task_queue = task_queue or TaskQueue()
        self._json_file_reader = json_file_reader or JsonFileReader()
        self._json_command_translator = (
            json_command_translator or JsonCommandTranslator()
        )
        self._python_file_reader = python_file_reader or PythonFileReader()
        self._python_context_creator = python_context_creator or PythonContextCreator()
        self._python_executor = python_executor or PythonExecutor()
        self._legacy_file_reader = legacy_file_reader or LegacyFileReader()
        self._legacy_context_creator = legacy_context_creator or LegacyContextCreator(
            hardware_api=hardware_api,
            use_simulating_implementation=False,
        )
        self._legacy_executor = legacy_executor or LegacyExecutor(
            hardware_api=hardware_api
        )

    def load(self, protocol_source: ProtocolSource) -> None:
        """Load a ProtocolSource into managed ProtocolEngine.

        Calling this method is only necessary if the runner will be used
        to control the run of a file-based protocol.
        """
        pre_analysis = protocol_source.pre_analysis

        if isinstance(pre_analysis, JsonPreAnalysis):
            schema_version = pre_analysis.schema_version

            if schema_version >= LEGACY_JSON_SCHEMA_VERSION_CUTOFF:
                self._load_json(protocol_source)
            else:
                self._load_legacy(protocol_source)

        elif isinstance(pre_analysis, PythonPreAnalysis):
            api_version = pre_analysis.api_version

            if api_version >= LEGACY_PYTHON_API_VERSION_CUTOFF:
                self._load_python(protocol_source)
            else:
                self._load_legacy(protocol_source)

        # ensure the engine is stopped gracefully once the
        # protocol file stops issuing commands
        self._task_queue.set_cleanup_func(
            func=self._protocol_engine.stop,
        )

    def play(self) -> None:
        """Start or resume the run."""
        self._protocol_engine.play()
        self._task_queue.start()

    def pause(self) -> None:
        """Pause the run."""
        self._protocol_engine.pause()

    async def stop(self) -> None:
        """Stop (cancel) the run."""
        await self._protocol_engine.halt()

    async def join(self) -> None:
        """Wait for the run to complete, propagating any errors.

        This method may be called before the run starts, in which case,
        it will wait for the run to start before waiting for completion.
        """
        return await self._task_queue.join()

    async def run(self, protocol_source: ProtocolSource) -> ProtocolRunData:
        """Run a given protocol to completion."""
        self.load(protocol_source)
        self.play()
        await self.join()

        commands = self._protocol_engine.state_view.commands.get_all()
        labware = self._protocol_engine.state_view.labware.get_all()
        pipettes = self._protocol_engine.state_view.pipettes.get_all()

        return ProtocolRunData(commands=commands, labware=labware, pipettes=pipettes)

    def _load_json(self, protocol_source: ProtocolSource) -> None:
        protocol = self._json_file_reader.read(protocol_source)
        commands = self._json_command_translator.translate(protocol)
        for request in commands:
            self._protocol_engine.add_command(request=request)

        self._task_queue.set_run_func(
            func=self._protocol_engine.wait_until_complete,
        )

    def _load_python(self, protocol_source: ProtocolSource) -> None:
        protocol = self._python_file_reader.read(protocol_source)
        context = self._python_context_creator.create(self._protocol_engine)
        self._task_queue.set_run_func(
            func=self._python_executor.execute,
            protocol=protocol,
            context=context,
        )

    def _load_legacy(
        self,
        protocol_source: ProtocolSource,
    ) -> None:
        protocol = self._legacy_file_reader.read(protocol_source)
        context = self._legacy_context_creator.create(protocol.api_level)

        self._protocol_engine.add_plugin(
            LegacyContextPlugin(
                hardware_api=self._hardware_api,
                protocol_context=context,
            )
        )

        self._task_queue.set_run_func(
            func=self._legacy_executor.execute,
            protocol=protocol,
            context=context,
        )
