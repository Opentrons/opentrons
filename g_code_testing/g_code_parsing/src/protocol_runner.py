import os
import sys
import threading
import asyncio
from typing import Generator
from collections import namedtuple

from opentrons.hardware_control.emulation.settings import Settings
from opentrons.protocols.parse import parse
from opentrons.protocols.execution import execute
from contextlib import contextmanager
from opentrons.protocol_api import ProtocolContext
from opentrons.config.robot_configs import build_config
from opentrons.hardware_control.emulation.app import ServerManager
from opentrons.hardware_control import API, ThreadManager
from opentrons.hardware_control.emulation.app import (
    MAGDECK_PORT,
    TEMPDECK_PORT,
    THERMOCYCLER_PORT,
    SMOOTHIE_PORT,
)
from g_code_program.g_code_program import (
    GCodeProgram,
)
from g_code_watcher import GCodeWatcher
from opentrons.protocols.context.protocol_api.protocol_context import (
    ProtocolContextImplementation,
)


Protocol = namedtuple("Protocol", ["text", "filename", "filelike"])


class ProtocolRunner:
    """
    Class for running a Protocol against the emulator.
    See src/opentrons/hardware_control/emulation/settings.py for example explanation
    of Smoothie configs

    Workflow is as follows:
        1. Instantiate Protocol Runner
        2. Call run_protocol method
        3. Gather parsed data from returned GCodeProgram
    """

    URI_TEMPLATE = "socket://127.0.0.1:%s"

    def __init__(self, smoothie_config: Settings) -> None:
        self._config = smoothie_config
        self._set_env_vars()

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
    def _set_env_vars() -> None:
        """Set URLs of where to find modules and config for smoothie"""
        os.environ["OT_MAGNETIC_EMULATOR_URI"] = (
            ProtocolRunner.URI_TEMPLATE % MAGDECK_PORT
        )
        os.environ["OT_THERMOCYCLER_EMULATOR_URI"] = (
            ProtocolRunner.URI_TEMPLATE % THERMOCYCLER_PORT
        )
        os.environ["OT_TEMPERATURE_EMULATOR_URI"] = (
            ProtocolRunner.URI_TEMPLATE % TEMPDECK_PORT
        )

    @staticmethod
    def _start_emulation_app(server_manager: ServerManager) -> None:
        """Start emulated OT-2"""

        def runit():
            asyncio.run(server_manager.run())

        t = threading.Thread(target=runit)
        t.daemon = True
        t.start()

    @staticmethod
    def _emulate_hardware() -> ThreadManager:
        """Created emulated smoothie"""
        conf = build_config({})
        emulator = ThreadManager(
            API.build_hardware_controller,
            conf,
            ProtocolRunner.URI_TEMPLATE % SMOOTHIE_PORT,
        )
        return emulator

    @staticmethod
    def _get_protocol(file_path: str) -> Protocol:
        with open(file_path) as file:
            text = "".join(list(file))
            file.seek(0)

        return Protocol(text=text, filename=file_path, filelike=file)

    @contextmanager
    def run_protocol(self, file_path: str) -> Generator:
        """
        Runs passed protocol file and collects all G-Code I/O from it.
        Will cleanup emulation after execution
        :param file_path: Path to file
        :return: GCodeProgram with all the parsed data
        """
        server_manager = ServerManager(self._config)
        self._start_emulation_app(server_manager)
        emulated_hardware = self._emulate_hardware()
        protocol = self._get_protocol(file_path)
        context = ProtocolContext(
            implementation=ProtocolContextImplementation(hardware=emulated_hardware),
            loop=self._get_loop(),
        )
        parsed_protocol = parse(protocol.text, protocol.filename)
        with GCodeWatcher() as watcher:
            execute.run_protocol(parsed_protocol, context=context)
        yield GCodeProgram.from_g_code_watcher(watcher)
        server_manager.stop()
