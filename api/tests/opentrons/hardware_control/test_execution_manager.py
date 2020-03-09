import asyncio
import pytest
from opentrons.hardware_control import (ExecutionManager, ExecutionState,
                                        ExecutionCancelledError)


async def test_state_machine(loop):
    """
    Test that an execution manager's state is RUNNING on init
    and PAUSE when it when pause is called, unless CANCELLED
    """
    exec_mgr = ExecutionManager(loop=loop)
    assert await exec_mgr.get_state() == ExecutionState.RUNNING

    await exec_mgr.pause()
    assert await exec_mgr.get_state() == ExecutionState.PAUSED

    await exec_mgr.resume()
    assert await exec_mgr.get_state() == ExecutionState.RUNNING

    await exec_mgr.cancel()
    assert await exec_mgr.get_state() == ExecutionState.CANCELLED

    with pytest.raises(ExecutionCancelledError):
        await exec_mgr.pause()

    await exec_mgr.reset()
    assert await exec_mgr.get_state() == ExecutionState.RUNNING


async def test_cancel_tasks(loop):
    """
    Test that an execution manager cancels all un-protected
    running asyncio Tasks when cancel is called
    """
    async def fake_task():
        while True:
            await asyncio.sleep(1)

    exec_mgr = ExecutionManager(loop=loop)

    unprotected_task = loop.create_task(fake_task())

    protected_task = loop.create_task(fake_task())

    # current, protected, and unprotected
    assert len(asyncio.all_tasks(loop)) == 3
    assert len([t for t in asyncio.all_tasks(loop) if t.cancelled()]) == 0

    await exec_mgr.cancel(protected_tasks={protected_task})
    await asyncio.sleep(0.1)

    all_tasks = asyncio.all_tasks(loop)
    assert len(all_tasks) == 2  # current and protected
    assert protected_task in all_tasks
    assert unprotected_task not in all_tasks
