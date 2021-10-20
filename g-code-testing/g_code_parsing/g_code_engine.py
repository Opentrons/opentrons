import os
import sys
import threading
import asyncio
from typing import Generator, Callable
from collections import namedtuple

from opentrons.hardware_control.emulation.magdeck import MagDeckEmulator
from opentrons.hardware_control.emulation.parser import Parser
from opentrons.hardware_control.emulation.run_emulator import \
    run_emulator_client
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.hardware_control.emulation.tempdeck import TempDeckEmulator
from opentrons.hardware_control.emulation.thermocycler import \
    ThermocyclerEmulator
from opentrons.protocols.parse import parse
from opentrons.protocols.execution import execute
from contextlib import contextmanager
from opentrons.protocol_api import ProtocolContext
from opentrons.config.robot_configs import build_config
from opentrons.hardware_control.emulation.app import Application
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
        os.environ["OT_MAGNETIC_EMULATOR_URI"] = GCodeEngine.URI_TEMPLATE % settings.magdeck_proxy.driver_port
        os.environ["OT_THERMOCYCLER_EMULATOR_URI"] = (
            GCodeEngine.URI_TEMPLATE % settings.thermocycler_proxy.driver_port
        )
        os.environ["OT_TEMPERATURE_EMULATOR_URI"] = (
            GCodeEngine.URI_TEMPLATE % settings.temperature_proxy.driver_port
        )

    @staticmethod
    def _start_emulation_app(application: Application, emulator_settings: Settings) -> None:
        """Start emulated OT-2"""
        async def _run_emulation_environment() -> None:
            await asyncio.gather(
                # Start application
                Application(settings=emulator_settings).run(),
                # Add magdeck emulator
                run_emulator_client(
                    host="localhost",
                    port=emulator_settings.magdeck_proxy.emulator_port,
                    emulator=MagDeckEmulator(Parser()),
                ),
                # Add temperature emulator
                run_emulator_client(
                    host="localhost",
                    port=emulator_settings.temperature_proxy.emulator_port,
                    emulator=TempDeckEmulator(Parser()),
                ),
                # Add thermocycler emulator
                run_emulator_client(
                    host="localhost",
                    port=emulator_settings.thermocycler_proxy.emulator_port,
                    emulator=ThermocyclerEmulator(Parser()),
                ),
            )

        def runit():
            asyncio.run(_run_emulation_environment())

        t = threading.Thread(target=runit)
        t.daemon = True
        t.start()

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
        emulator_app = Application(self._config)
        self._start_emulation_app(application=emulator_app, emulator_settings=self._config)
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
        # emulator_app.stop()

    @contextmanager
    def run_http(self, executable: Callable):
        """
        Runs http request and returns all G-Code I/O from it
        :param executable: Function connected to HTTP Request to execute
        :return:
        """
        emulator_app = Application(self._config)
        self._start_emulation_app(application=emulator_app, emulator_settings=self._config)
        with GCodeWatcher(emulator_settings=self._config) as watcher:
            asyncio.run(executable(hardware=self._emulate_hardware(settings=self._config)))
        yield GCodeProgram.from_g_code_watcher(watcher)
        # emulator_app.stop()
