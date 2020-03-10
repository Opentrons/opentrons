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

    # passes through on wait_for_is_running if state is RUNNING
    await asyncio.wait_for(exec_mgr.wait_for_is_running(), timeout=0.2)

    await exec_mgr.pause()
    assert await exec_mgr.get_state() == ExecutionState.PAUSED

    with pytest.raises(asyncio.TimeoutError):
        # should stall on wait_for_is_running when state is PAUSED
        await asyncio.wait_for(exec_mgr.wait_for_is_running(), timeout=0.2)

    await exec_mgr.resume()
    assert await exec_mgr.get_state() == ExecutionState.RUNNING

    await exec_mgr.cancel()
    assert await exec_mgr.get_state() == ExecutionState.CANCELLED

    with pytest.raises(ExecutionCancelledError):
        # attempting to pause when CANCELLED should raise
        await exec_mgr.pause()

    with pytest.raises(ExecutionCancelledError):
        # should raise on wait_for_is_running when state is CANCELLED
        await asyncio.wait_for(exec_mgr.wait_for_is_running(), timeout=0.2)

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

    cancellable_task = loop.create_task(fake_task())
    exec_mgr.register_cancellable_task(cancellable_task)

    other_task = loop.create_task(fake_task())

    # current, cancellable, and other
    assert len(asyncio.all_tasks(loop)) == 3
    assert len([t for t in asyncio.all_tasks(loop) if t.cancelled()]) == 0

    await exec_mgr.cancel()
    await asyncio.sleep(0.1)

    all_tasks = asyncio.all_tasks(loop)
    assert len(all_tasks) == 2  # current and other
    assert other_task in all_tasks
    assert cancellable_task not in all_tasks
