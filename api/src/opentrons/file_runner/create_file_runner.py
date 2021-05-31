"""Protocol runner factory."""
from pathlib import Path
from typing import Optional

from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocols.runner import CommandTranslator

from .abstract_file_runner import AbstractFileRunner
from .json_file_runner import JsonFileRunner
from .json_file_reader import JsonFileReader
from .command_queue_worker import CommandQueueWorker
from .protocol_file import ProtocolFileType, JsonProtocolFile


def create_file_runner(
    file_type: Optional[ProtocolFileType],
    file_path: Optional[Path],
    engine: ProtocolEngine,
) -> AbstractFileRunner:
    """Construct a wired-up protocol runner instance.

    Arguments:
        file: Protocol file the runner will be using. If `None`, returns
            a basic runner for ProtocolEngine usage without a file.
        engine: The protocol engine interface the runner will use.

    Returns:
        A runner appropriate for the requested protocol type.
    """
    file = None

    if file_path is not None and file_type == ProtocolFileType.JSON:
        file = JsonProtocolFile(file_path=file_path)

    if isinstance(file, JsonProtocolFile):
        return JsonFileRunner(
            file=file,
            protocol_engine=engine,
            file_reader=JsonFileReader(),
            command_translator=CommandTranslator(),
            command_queue_worker=CommandQueueWorker(),
        )

    raise NotImplementedError("Other runner types not yet supported")
