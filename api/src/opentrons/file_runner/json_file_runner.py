"""File runner interfaces for JSON protocols."""
from opentrons.protocol_engine import ProtocolEngine

from .abstract_file_runner import AbstractFileRunner
from .json_file_reader import JsonFileReader
from .json_command_translator import CommandTranslator
from .protocol_file import ProtocolFile


class JsonFileRunner(AbstractFileRunner):
    """JSON protocol file runner."""

    def __init__(
        self,
        file: ProtocolFile,
        file_reader: JsonFileReader,
        protocol_engine: ProtocolEngine,
        command_translator: CommandTranslator,
    ) -> None:
        """JSON file runner constructor.

        Args:
            file: a JSON protocol file
            file_reader: an interface to read the file into a data model.
            protocol_engine: instance of the Protocol Engine
            command_translator: the JSON command translator
            command_queue_worker: Command Queue worker
        """
        self._file = file
        self._file_reader = file_reader
        self._protocol_engine = protocol_engine
        self._command_translator = command_translator

    def load(self) -> None:
        """Translate JSON commands and send them to protocol engine."""
        protocol = self._file_reader.read(self._file)
        translated_items = self._command_translator.translate(protocol)
        for cmd in translated_items:
            self._protocol_engine.add_command(cmd)

    async def run(self) -> None:
        """Run the protocol to completion."""
        self._protocol_engine.play()
        await self._protocol_engine.stop(wait_until_complete=True)
