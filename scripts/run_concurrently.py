"""Run multiple commands concurrently, and stop them all on ^C.

Usage:
    python run_concurrently.py cmd1 cmd1_arg1 cmd1_arg2 ';' cmd2 cmd2_arg1 cmd2_arg2

Use ';' to delimit the separate commands.
Make sure it's appropriately quoted if you're running this in a shell.
"""

import asyncio
import asyncio.subprocess
import contextlib
import os
import signal
import sys
import typing

DELIMITER = ";"
TERMINATE_TIMEOUT_SEC = 5


async def run_command(command: list[str]) -> None:
    output(f"Launching command {command}")
    subprocess = await asyncio.create_subprocess_exec(
        command[0],
        *command[1:],
        stdin=asyncio.subprocess.DEVNULL,
        start_new_session=True,  # For os.killpg().
    )
    try:
        await subprocess.wait()
    except asyncio.CancelledError:
        output(f"Killing command {command}")
        await terminate_process(subprocess, TERMINATE_TIMEOUT_SEC)
    output(f"Command {command} exited, code {subprocess.returncode}")


async def run_commands_concurrently(commands: list[list[str]]) -> None:
    try:
        async with asyncio.TaskGroup() as task_group:
            for command in commands:
                task_group.create_task(run_command(command))
    except asyncio.CancelledError:
        pass


async def terminate_process(
    process: asyncio.subprocess.Process, timeout_sec: float
) -> None:
    """Politely terminate a process, or force-kill it if that takes too long.

    Returns after the process is no longer running.
    """
    if process.returncode is not None:
        return  # Already stopped.

    try:
        # Polite termination: send SIGTERM to our direct child process.
        # If it has its own children, let it terminate them on its own terms.
        async with asyncio.timeout(timeout_sec):
            process.terminate()
            await process.wait()
    except asyncio.TimeoutError:
        # Forceful termination after timeout: send SIGKILL to the entire process group.
        with contextlib.suppress(ProcessLookupError):
            os.killpg(process.pid, signal.SIGKILL)


def split(
    source: typing.Iterable[str], delimiter: str
) -> typing.Generator[list[str], None, None]:
    chunk: list[str] = []
    for element in source:
        if element == delimiter:
            yield chunk
            chunk = []
        else:
            chunk.append(element)
    yield chunk


def output(message: str) -> None:
    print(f"{__file__}: {message}")


if __name__ == "__main__":
    commands = list(split(sys.argv[1:], DELIMITER))
    asyncio.run(run_commands_concurrently(commands))
    output("Exiting")
