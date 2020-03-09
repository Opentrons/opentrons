import asyncio
from opentrons.hardware_control import ExecutionManager


def test_is_running(loop):
    """
    Test that an execution manager hoists the run flag on init
    and lowers it when pause is called, then re-hoists upon calling resume
    """
    exec_mgr = ExecutionManager(loop=loop)
    assert exec_mgr.is_running

    exec_mgr.pause()
    assert not exec_mgr.is_running

    exec_mgr.resume()
    assert exec_mgr.is_running

    exec_mgr.cancel()
    assert exec_mgr.is_running


def test_cancel_tasks(loop):
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

    assert len(asyncio.all_tasks(loop)) == 2
    assert len([t for t in asyncio.all_tasks(loop) if t.cancelled()]) == 0

    exec_mgr.cancel(protected_tasks={protected_task})
    loop.run_until_complete(asyncio.sleep(0.1))

    all_tasks = asyncio.all_tasks(loop)
    assert len(all_tasks) == 1
    assert protected_task in all_tasks
    assert unprotected_task not in all_tasks
