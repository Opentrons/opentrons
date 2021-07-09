"""Protocol runner factory."""
import asyncio
from typing import Optional

from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocols.runner import CommandTranslator

from .abstract_file_runner import AbstractFileRunner
from .protocol_file import ProtocolFileType, ProtocolFile

from .json_file_runner import JsonFileRunner
from .json_file_reader import JsonFileReader
from .command_queue_worker import CommandQueueWorker

from .python_file_runner import PythonFileRunner
from .python_reader import PythonFileReader
from .context_creator import ContextCreator
from .python_executor import PythonExecutor


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
    if protocol_file is not None:
        if protocol_file.file_type == ProtocolFileType.JSON:
            return JsonFileRunner(
                file=protocol_file,
                protocol_engine=engine,
                file_reader=JsonFileReader(),
                command_translator=CommandTranslator(),
                command_queue_worker=CommandQueueWorker(engine=engine),
            )
        elif protocol_file.file_type == ProtocolFileType.PYTHON:
            loop = asyncio.get_running_loop()

            return PythonFileRunner(
                file=protocol_file,
                file_reader=PythonFileReader(),
                context_creator=ContextCreator(engine=engine, loop=loop),
                executor=PythonExecutor(loop=loop),
            )

    raise NotImplementedError("Other runner types not yet supported")
