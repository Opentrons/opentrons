import os
import sys
import threading
import asyncio
from typing import Generator
from collections import namedtuple
from abc import ABC, abstractmethod
from importlib import import_module

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
from g_code_parsing.g_code_program.g_code_program import (
    GCodeProgram,
)
from g_code_parsing.g_code_watcher import GCodeWatcher
from opentrons.protocols.context.protocol_api.protocol_context import (
    ProtocolContextImplementation,
)
from g_code_parsing.utils import get_configuration_dir


Protocol = namedtuple("Protocol", ["text", "filename", "filelike"])


class GCodeEngine(ABC):
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
                GCodeEngine.URI_TEMPLATE % MAGDECK_PORT
        )
        os.environ["OT_THERMOCYCLER_EMULATOR_URI"] = (
                GCodeEngine.URI_TEMPLATE % THERMOCYCLER_PORT
        )
        os.environ["OT_TEMPERATURE_EMULATOR_URI"] = (
                GCodeEngine.URI_TEMPLATE % TEMPDECK_PORT
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
            GCodeEngine.URI_TEMPLATE % SMOOTHIE_PORT,
        )
        return emulator

    @staticmethod
    def _get_protocol(file_path: str) -> Protocol:
        with open(file_path) as file:
            text = "".join(list(file))
            file.seek(0)

        return Protocol(text=text, filename=file_path, filelike=file)

    @abstractmethod
    def run(self, input_str: str):
        ...


class ProtocolGCodeEngine(GCodeEngine):

    @contextmanager
    def run(self, input_str: str) -> Generator:
        """
        Runs passed protocol file and collects all G-Code I/O from it.
        Will cleanup emulation after execution
        :param input_str: Path to file
        :return: GCodeProgram with all the parsed data
        """
        file_path = os.path.join(
            get_configuration_dir(), input_str
        )
        server_manager = ServerManager(self._config)
        self._start_emulation_app(server_manager)
        protocol = self._get_protocol(file_path)
        context = ProtocolContext(
            implementation=ProtocolContextImplementation(
                hardware=self._emulate_hardware()
            ),
            loop=self._get_loop(),
        )
        parsed_protocol = parse(protocol.text, protocol.filename)
        with GCodeWatcher() as watcher:
            execute.run_protocol(parsed_protocol, context=context)
        yield GCodeProgram.from_g_code_watcher(watcher)
        server_manager.stop()


class HTTPGCodeEngine(GCodeEngine):

    def _get_func(self, input_str):
        formatted_config_path = os.path.splitext(input_str)[0].replace(
            '/', '.')
        module_string = f'test_data.{formatted_config_path}'
        module = import_module(module_string)
        return module.main()

    @contextmanager
    def run(self, input_str: str):
        """
        Runs http request and returns all G-Code I/O from it
        :param input_str:
        :return:
        """
        func = self._get_func(input_str)
        server_manager = ServerManager(self._config)
        self._start_emulation_app(server_manager)
        with GCodeWatcher() as watcher:
            asyncio.run(func(hardware=self._emulate_hardware()))
        yield GCodeProgram.from_g_code_watcher(watcher)
        server_manager.stop()