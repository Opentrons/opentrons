"""

The task runner refactor is now using anyio instead of fastapi.BackgroundTasks.
Testing will be similar to the previous code base primarily integration and end-to-end tests.
"""
from __future__ import annotations
from logging import getLogger
from typing import Any, Awaitable, Callable
from anyio import create_task_group
from anyio.abc import TaskGroup
from fastapi import Depends
from robot_server.app_state import AppState, AppStateValue, get_app_state


log = getLogger(__name__)

TaskFunc = Callable[..., Awaitable[Any]]

           
class TaskRunner:
    def __init__(self, task_group: TaskGroup) -> None:
        """Initialize the TaskRunner using Anyio
        __init__() is private, not to be called by anything outside of this module.ç
        """
        self._task_group = task_group

    
    @classmethod    
    async def make_task_runner(cls) -> TaskRunner:
        tg = create_task_group() 
        await tg.__aenter__()
        return cls(tg)
        
            
    def run(self, func: TaskFunc, *args: Any) -> None:
        """Run an async function in the background.

        Will log when the function completes, including any error
        that may occur.

        Arguments:
            func: An async, None-returning function to run in the background.
            Use *args to outling the 1:1 correspondence of each tasks.
        """
        func_name = func.__qualname__
        self._task_group.start_soon(func, *args, name = func_name)

          
    async def cancel_all_and_clean_up(self, func_name) -> None:
        self._task_group.cancel_scope.cancel()
        await self.__task_group.__aexit__() 
        log.cancel(f"Background task {func_name} cancelled_cleanedup")
        # Clean up all cancelled tasks 
        raise NotImplementedError
    
def get_task_runner(app_state: AppState = Depends(get_app_state)) -> TaskRunner:
    return app_state.task_runner
  
        
            
