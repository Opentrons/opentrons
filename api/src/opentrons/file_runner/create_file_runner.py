"""Protocol runner factory."""
from typing import Optional

from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocols.runner import CommandTranslator

from .abstract_file_runner import AbstractFileRunner
from .json_file_runner import JsonFileRunner
from .json_file_reader import JsonFileReader
from .command_queue_worker import CommandQueueWorker
from .protocol_file import ProtocolFileType, ProtocolFile


def create_file_runner(
    protocol_file: Optional[ProtocolFile],
    engine: ProtocolEngine,
) -> AbstractFileRunner:
    """Construct a wired-up protocol runner instance.

    Arguments:
        protocol_file: Protocol file the runner will be using. If `None`,
            returns a basic runner for ProtocolEngine usage without a file.
        engine: The protocol engine interface the runner will use.

    Returns:
        A runner appropriate for the requested protocol type.
    """
    if protocol_file is not None and protocol_file.file_type == ProtocolFileType.JSON:
        return JsonFileRunner(
            file=protocol_file,
            protocol_engine=engine,
            file_reader=JsonFileReader(),
            command_translator=CommandTranslator(),
            command_queue_worker=CommandQueueWorker(),
        )

    raise NotImplementedError("Other runner types not yet supported")
