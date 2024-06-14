from typing import AsyncGenerator

from .run_orchestrator import RunOrchestrator
from ..protocol_engine.errors import RunStoppedError


class CommandGenerator:
    def __init__(self, run_orchestrator: RunOrchestrator):
        self._run_orchestrator = run_orchestrator

    async def command_generator(self) -> AsyncGenerator[str, None]:
        while True:
            try:
                command_id = await self._run_orchestrator._protocol_engine._state_store.wait_for(
                    condition=self._run_orchestrator._protocol_engine.state_view.commands.get_next_to_execute
                )
                # Assert for type hinting. This is valid because the wait_for() above
                # only returns when the value is truthy.
                assert command_id is not None
                yield command_id
            except RunStoppedError:
                # There are no more commands that we should execute, either because the run has
                # completed on its own, or because a client requested it to stop.
                break

    async def get_next_command_to_execute(self) -> None:
        gen = self.command_generator()
        async for command in gen:
            print(command)
