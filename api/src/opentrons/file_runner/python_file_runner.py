"""File runner interfaces for Python protocols."""
from .abstract_file_runner import AbstractFileRunner
from .protocol_file import ProtocolFile
from .python_file_reader import PythonFileReader
from .python_executor import PythonExecutor
from .context_creator import ProtocolContextCreator


class PythonFileRunner(AbstractFileRunner):
    """Python protocol file runner."""

    def __init__(
        self,
        file: ProtocolFile,
        file_reader: PythonFileReader,
        context_creator: ProtocolContextCreator,
        executor: PythonExecutor,
    ) -> None:
        self._file = file
        self._file_reader = file_reader
        self._context_creator = context_creator
        self._executor = executor

    def load(self) -> None:
        """Prepare to run the Python protocol file."""
        protocol = self._file_reader.read(file=self._file)
        context = self._context_creator.create(protocol=protocol)
        self._executor.load(protocol=protocol, context=context)

    def play(self) -> None:
        """Start (or un-pause) running the Python protocol file."""
        self._executor.execute()

    def pause(self) -> None:
        """Pause the running Python protocol file's execution."""
        raise NotImplementedError()

    def stop(self) -> None:
        """Cancel the running Python protocol file."""
        raise NotImplementedError()
