import os
import sys
import asyncio
import time
from multiprocessing import Process
from typing import Generator, Callable, Iterator
from collections import namedtuple

from opentrons import APIVersion
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.hardware_control.emulation.types import ModuleType
from opentrons.protocols.parse import parse
from opentrons.protocols.execution import execute
from contextlib import contextmanager
from opentrons.protocol_api import ProtocolContext
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
from opentrons.protocols.context.protocol_api.protocol_context import (
    ProtocolContextImplementation,
)
from g_code_parsing.utils import get_configuration_dir

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

    @staticmethod
    def _get_loop() -> asyncio.AbstractEventLoop:
        """Create an event loop"""
        if sys.platform == "win32":
            _loop = asyncio.ProactorEventLoop()
        else:
            _loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_loop)
        return asyncio.get_event_loop()

    @contextmanager
    def _emulate(self) -> Iterator[ThreadManager]:
        """Context manager that starts emulated OT-2 hardware environment. A
        hardware controller is returned."""
        modules = [ModuleType.Magnetic, ModuleType.Temperature, ModuleType.Thermocycler]

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
    def _get_protocol(file_path: str) -> Protocol:
        with open(file_path) as file:
            text = "".join(list(file))
            file.seek(0)

        return Protocol(text=text, filename=file_path, filelike=file)

    @contextmanager
    def run_protocol(self, path: str, version: APIVersion) -> Generator:
        """
        Runs passed protocol file and collects all G-Code I/O from it.
        Will cleanup emulation after execution
        :param path: Path to file
        :param version: API version to use
        :return: GCodeProgram with all the parsed data
        """
        file_path = os.path.join(get_configuration_dir(), path)
        with self._emulate() as h:
            protocol = self._get_protocol(file_path)
            context = ProtocolContext(
                implementation=ProtocolContextImplementation(sync_hardware=h.sync),
                loop=self._get_loop(),
                api_version=version,
            )
            parsed_protocol = parse(protocol.text, protocol.filename)
            with GCodeWatcher(emulator_settings=self._config) as watcher:
                execute.run_protocol(parsed_protocol, context=context)
            yield GCodeProgram.from_g_code_watcher(watcher)

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
