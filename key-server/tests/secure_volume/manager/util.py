from typing import Any, Protocol

from decoy import Decoy


class StreamReader(Protocol):
    async def read(self) -> str: ...


class AsyncioSubprocess(Protocol):
    async def wait(self) -> int: ...

    async def communicate(self, input: str | bytes | None = None) -> tuple[str, str]:
        pass

    @property
    def stdout(self) -> StreamReader: ...

    @property
    def stderr(self) -> StreamReader: ...

    @property
    def returncode(self) -> int: ...


class AsyncioCSE(Protocol):
    async def __call__(
        self,
        program: str,
        *args: str,
        stdin: Any | None = None,
        stdout: Any | None = None,
        stderr: Any | None = None,
        limit: Any | None = None,
        **kwargs: Any,
    ) -> AsyncioSubprocess: ...


async def build_subproc_result(
    decoy: Decoy, returncode: int, stdout: str, stderr: str
) -> AsyncioSubprocess:
    mock_subproc = decoy.mock(cls=AsyncioSubprocess)
    mock_stdout = decoy.mock(cls=StreamReader)
    mock_stderr = decoy.mock(cls=StreamReader)
    decoy.when(await mock_subproc.wait()).then_return(returncode)
    decoy.when(mock_subproc.returncode).then_return(returncode)
    decoy.when(mock_subproc.stdout).then_return(mock_stdout)
    decoy.when(mock_subproc.stderr).then_return(mock_stderr)
    decoy.when(await mock_stdout.read()).then_return(stdout)
    decoy.when(await mock_stderr.read()).then_return(stderr)
    return mock_subproc
