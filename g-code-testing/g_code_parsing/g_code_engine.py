import asyncio
from pathlib import Path
import time
from multiprocessing import Process
from typing import AsyncGenerator, Callable, Iterator, Union
from collections import namedtuple

from opentrons import APIVersion
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.protocol_engine import create_protocol_engine, Config, DeckType
from opentrons.protocol_reader.protocol_source import (
    JsonProtocolConfig,
    ProtocolConfig,
    ProtocolSource,
    PythonProtocolConfig,
)
from opentrons.protocol_runner.protocol_runner import create_protocol_runner
from opentrons.protocols.parse import parse
from opentrons.protocols.execution import execute
from opentrons.protocols.api_support import deck_type
from contextlib import asynccontextmanager, contextmanager
from opentrons.protocol_api import create_protocol_context
from opentrons.config.robot_configs import build_config
from opentrons.hardware_control.emulation.module_server.helpers import (
    wait_emulators,
    ModuleStatusClient,
)
from opentrons.hardware_control.emulation.scripts import run_app, run_smoothie
from opentrons.hardware_control import API, ThreadManager
from g_code_parsing.g_code_program.g_code_program import (
    GCodeProgram,
)
from g_code_parsing.g_code_watcher import GCodeWatcher
from g_code_parsing.utils import get_configuration_dir
from opentrons_shared_data.robot.dev_types import RobotType

Protocol = namedtuple("Protocol", ["text", "filename", "filelike"])


class GCodeEngine:
    """
    Class for running a thing against the emulator.
    See src/opentrons/hardware_control/emulation/settings.py for example explanation
    of Smoothie configs

    Add new run_* methods to class to support different inputs to the engine

    Workflow is as follows:
        1. Instantiate GCodeEngine
        2. Call run_* method
        3. Gather parsed data from returned GCodeProgram
    """

    URI_TEMPLATE = "socket://127.0.0.1:%s"

    def __init__(self, emulator_settings: Settings) -> None:
        self._config = emulator_settings

    @contextmanager
    def _emulate(self) -> Iterator[ThreadManager]:
        """Context manager that starts emulated OT-2 hardware environment. A
        hardware controller is returned."""
        modules = self._config.modules

        # Entry point for the emulator app process
        def _run_app():
            async def _async_entry():
                await asyncio.gather(
                    run_smoothie.run(self._config),
                    run_app.run(self._config, modules=[m.value for m in modules]),
                )

            asyncio.run(_async_entry())

        proc = Process(target=_run_app)
        proc.daemon = True
        proc.start()

        # Entry point for process that waits for emulation to be ready.
        async def _wait_ready() -> None:
            c = await ModuleStatusClient.connect(
                host="localhost", port=self._config.module_server.port
            )
            await wait_emulators(client=c, modules=modules, timeout=5)
            c.close()

        def _run_wait_ready():
            asyncio.run(_wait_ready())

        ready_proc = Process(target=_run_wait_ready)
        ready_proc.daemon = True
        ready_proc.start()
        ready_proc.join()

        # Hardware controller
        conf = build_config({})
        emulator = ThreadManager(
            API.build_hardware_controller,
            conf,
            GCodeEngine.URI_TEMPLATE % self._config.smoothie.port,
        )
        # Wait for modules to be present
        while len(emulator.attached_modules) != len(modules):
            time.sleep(0.1)

        yield emulator

        # Finished. Stop the emulator
        proc.kill()
        proc.join()

    @staticmethod
    def _get_protocol(file_path: Path) -> Protocol:
        with open(file_path) as file:
            text = "".join(list(file))
            file.seek(0)

        return Protocol(text=text, filename=file_path.name, filelike=file)

    @asynccontextmanager
    async def run_protocol(
        self,
        path: str,
        # TODO(mm, 2023-05-16): version should be automatically derived from the protocol file.
        version: Union[APIVersion, int],
    ) -> AsyncGenerator:
        """
        Runs passed protocol file and collects all G-Code I/O from it.
        Will cleanup emulation after execution
        :param path: Path to file
        :param version: API version to use
        :return: GCodeProgram with all the parsed data
        """
        file_path = Path(get_configuration_dir(), path)

        # TODO(mm, 2023-05-16): robot_type should be automatically derived from the protocol file.
        robot_type: RobotType = "OT-2 Standard"

        with self._emulate() as hardware:
            if (isinstance(version, APIVersion) and version >= APIVersion(2, 14)) or (
                isinstance(version, int)
            ):
                # use direct creation instead of
                # ProtocolReader.read_and_save() to create
                # since we override the config
                config: ProtocolConfig
                if isinstance(version, int):
                    config = JsonProtocolConfig(schema_version=version)
                elif isinstance(version, APIVersion):
                    config = PythonProtocolConfig(api_version=version)
                protocol_source: ProtocolSource = ProtocolSource(
                    directory=file_path.parent,
                    main_file=file_path,
                    files=[],
                    metadata={},
                    robot_type=robot_type,
                    config=config,
                    # we don't actually need the content-hash for anything
                    # since this isn't using the server part, so let's give
                    # it a placeholder of the filepath
                    content_hash=path,
                )

                protocol_runner = create_protocol_runner(
                    protocol_config=config,
                    protocol_engine=await create_protocol_engine(
                        hardware_api=hardware,  # type: ignore
                        config=Config(
                            robot_type=robot_type,
                            deck_type=DeckType(
                                deck_type.for_simulation(robot_type=robot_type)
                            ),
                        ),
                    ),
                    hardware_api=hardware,  # type: ignore
                )
                with GCodeWatcher(emulator_settings=self._config) as watcher:
                    await protocol_runner.run(protocol_source=protocol_source)
                    yield GCodeProgram.from_g_code_watcher(watcher)
            elif isinstance(version, APIVersion) and version < APIVersion(2, 14):
                protocol = self._get_protocol(file_path)
                context = create_protocol_context(
                    api_version=version,
                    hardware_api=hardware,
                    deck_type=deck_type.for_simulation(robot_type=robot_type),
                )
                parsed_protocol = parse(protocol.text, protocol.filename)
                with GCodeWatcher(emulator_settings=self._config) as watcher:
                    execute.run_protocol(parsed_protocol, context=context)
                yield GCodeProgram.from_g_code_watcher(watcher)
            else:
                raise ValueError(f"APIVersion is {version}")

    @contextmanager
    def run_http(self, executable: Callable):
        """
        Runs http request and returns all G-Code I/O from it
        :param executable: Function connected to HTTP Request to execute
        :return:
        """
        with self._emulate() as h:
            with GCodeWatcher(emulator_settings=self._config) as watcher:
                asyncio.run(executable(hardware=h))
            yield GCodeProgram.from_g_code_watcher(watcher)
