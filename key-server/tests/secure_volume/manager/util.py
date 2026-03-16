import asyncio
from typing import Any, Protocol

from decoy import Decoy


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
    ) -> asyncio.subprocess.Process: ...


async def build_subproc_result(
    decoy: Decoy, returncode: int, stdout: str, stderr: str
) -> asyncio.subprocess.Process:
    mock_subproc = decoy.mock(cls=asyncio.subprocess.Process)
    mock_stdout = decoy.mock(cls=asyncio.streams.StreamReader)
    mock_stderr = decoy.mock(cls=asyncio.streams.StreamReader)
    decoy.when(await mock_subproc.wait()).then_return(returncode)
    decoy.when(mock_subproc.returncode).then_return(returncode)
    decoy.when(mock_subproc.stdout).then_return(mock_stdout)
    decoy.when(mock_subproc.stderr).then_return(mock_stderr)
    decoy.when(await mock_stdout.read()).then_return(stdout.encode())
    decoy.when(await mock_stderr.read()).then_return(stderr.encode())
    return mock_subproc
