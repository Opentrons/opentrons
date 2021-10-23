import os
import sys
import asyncio
from multiprocessing import Process
from typing import Generator, Callable
from collections import namedtuple

from opentrons.hardware_control.emulation.settings import Settings
from opentrons.hardware_control.emulation.types import ModuleType
from opentrons.protocols.parse import parse
from opentrons.protocols.execution import execute
from contextlib import contextmanager
from opentrons.protocol_api import ProtocolContext
from opentrons.config.robot_configs import build_config
from opentrons.hardware_control.emulation import module_server
from opentrons.hardware_control.emulation.scripts import run_app
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
        self._set_env_vars(emulator_settings)

    @staticmethod
    def _get_loop() -> asyncio.AbstractEventLoop:
        """Create an event loop"""
        if sys.platform == "win32":
            _loop = asyncio.ProactorEventLoop()
        else:
            _loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_loop)
        return asyncio.get_event_loop()

    @staticmethod
    def _set_env_vars(settings: Settings) -> None:
        """Set URLs of where to find modules and config for smoothie"""
        os.environ["OT_MAGNETIC_EMULATOR_URI"] = (
            GCodeEngine.URI_TEMPLATE % settings.magdeck_proxy.driver_port
        )
        os.environ["OT_THERMOCYCLER_EMULATOR_URI"] = (
            GCodeEngine.URI_TEMPLATE % settings.thermocycler_proxy.driver_port
        )
        os.environ["OT_TEMPERATURE_EMULATOR_URI"] = (
            GCodeEngine.URI_TEMPLATE % settings.temperature_proxy.driver_port
        )

    @staticmethod
    def _start_emulation_app(emulator_settings: Settings) -> Process:
        """Start emulated OT-2"""
        modules = [ModuleType.Magnetic, ModuleType.Temperature, ModuleType.Thermocycler]

        def runit():
            asyncio.run(
                run_app.run(emulator_settings, modules=[m.value for m in modules])
            )

        proc = Process(target=runit)
        proc.daemon = True
        proc.start()

        async def _wait_ready() -> None:
            c = await module_server.ModuleServerClient.connect(
                host="localhost", port=emulator_settings.module_server.port
            )
            await module_server.wait_emulators(client=c, modules=modules, timeout=5)
            c.close()

        proc2 = Process(target=lambda: asyncio.run(_wait_ready()))
        proc2.start()
        proc2.join()

        return proc

    @staticmethod
    def _emulate_hardware(settings: Settings) -> ThreadManager:
        """Created emulated smoothie"""
        conf = build_config({})
        emulator = ThreadManager(
            API.build_hardware_controller,
            conf,
            GCodeEngine.URI_TEMPLATE % settings.smoothie.port,
        )
        return emulator

    @staticmethod
    def _get_protocol(file_path: str) -> Protocol:
        with open(file_path) as file:
            text = "".join(list(file))
            file.seek(0)

        return Protocol(text=text, filename=file_path, filelike=file)

    @contextmanager
    def run_protocol(self, path: str) -> Generator:
        """
        Runs passed protocol file and collects all G-Code I/O from it.
        Will cleanup emulation after execution
        :param path: Path to file
        :return: GCodeProgram with all the parsed data
        """
        file_path = os.path.join(get_configuration_dir(), path)
        app_process = self._start_emulation_app(emulator_settings=self._config)
        protocol = self._get_protocol(file_path)
        context = ProtocolContext(
            implementation=ProtocolContextImplementation(
                hardware=self._emulate_hardware(settings=self._config)
            ),
            loop=self._get_loop(),
        )
        parsed_protocol = parse(protocol.text, protocol.filename)
        with GCodeWatcher(emulator_settings=self._config) as watcher:
            execute.run_protocol(parsed_protocol, context=context)
        yield GCodeProgram.from_g_code_watcher(watcher)
        app_process.terminate()
        app_process.join()

    @contextmanager
    def run_http(self, executable: Callable):
        """
        Runs http request and returns all G-Code I/O from it
        :param executable: Function connected to HTTP Request to execute
        :return:
        """
        app_process = self._start_emulation_app(emulator_settings=self._config)
        with GCodeWatcher(emulator_settings=self._config) as watcher:
            asyncio.run(
                executable(hardware=self._emulate_hardware(settings=self._config))
            )
        yield GCodeProgram.from_g_code_watcher(watcher)
        app_process.terminate()
        app_process.join()
