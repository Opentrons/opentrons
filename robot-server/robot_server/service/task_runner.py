"""

The task runner refactor is now using anyio instead of fastapi.BackgroundTasks.
Testing will be similar to the previous code base primarily integration and end-to-end tests.
"""

from __future__ import annotations
import asyncio
from logging import getLogger
from typing import Any, Awaitable, Callable, Set
from fastapi import Depends
from robot_server.app_state import AppState, AppStateValue, get_app_state


log = getLogger(__name__)

TaskFunc = Callable[..., Awaitable[Any]]

           
class TaskRunner:
    def __init__(self) -> None:
        """Initialize the TaskRunner by using Python Set
        """

        self._running_tasks: Set[asyncio.Task[None]] = set()
        #set of background tasks

     
    def run(self, func: TaskFunc, **kwargs: Any) -> None:
        """Run an async function in the background.

        Will log when the function completes, including any error
        that may occur.

        Arguments:
            func: An async, None-returning function to run in the background.
            Use **kwargs to pass to func.
        """
        func_name = func.__qualname__
                           
        new_ct = asyncio.create_task(func(**kwargs))
        #Create Tasks running in the background
        self._running_tasks.add(new_ct)
        
                    
    async def cancel_all_and_clean_up(self) -> None:
        for i in self._running_tasks: 
            i.cancel()
        await asyncio.gather(*self._running_tasks, return_exceptions = True)

        log.debug(f"Background task cancelled_cleanedup")
        # Clean up all cancelled tasks 

    
def get_task_runner(app_state: AppState = Depends(get_app_state)) -> TaskRunner:
    return app_state.task_runner
  
        
        
