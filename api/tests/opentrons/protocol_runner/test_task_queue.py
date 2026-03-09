"""Tests for TaskQueue."""
import asyncio
from decoy import Decoy
from opentrons.protocol_runner.task_queue import TaskQueue


async def test_set_run_func(decoy: Decoy) -> None:
    """It should be able to add a task for the "run" phase."""
    run_func = decoy.mock(name="run_func", is_async=True)
    cleanup_func = decoy.mock(name="cleanup_func", is_async=True)

    subject = TaskQueue()  # cleanup_func=cleanup_func)
    subject.set_cleanup_func(func=cleanup_func)
    subject.set_run_func(func=run_func)
    subject.start()
    await subject.join()

    decoy.verify(
        await run_func(),
        await cleanup_func(None),
    )


async def test_passes_args(decoy: Decoy) -> None:
    """It should pass kwargs to the run phase function."""
    run_func = decoy.mock(name="run_func", is_async=True)
    cleanup_func = decoy.mock(name="cleanup_func", is_async=True)

    subject = TaskQueue()  # cleanup_func=cleanup_func)
    subject.set_cleanup_func(func=cleanup_func)
    subject.set_run_func(func=run_func, hello="world")
    subject.start()
    await subject.join()

    decoy.verify(await run_func(hello="world"))


async def test_cleanup_gets_run_error(decoy: Decoy) -> None:
    """It should verify "cleanup" func gets error raised in "run" func."""
    run_func = decoy.mock(name="run_func", is_async=True)
    cleanup_func = decoy.mock(name="cleanup_func", is_async=True)
    error = RuntimeError("Oh no!")

    decoy.when(await run_func()).then_raise(error)

    subject = TaskQueue()  # cleanup_func=cleanup_func)
    subject.set_cleanup_func(func=cleanup_func)
    subject.set_run_func(func=run_func)
    subject.start()
    await subject.join()

    decoy.verify(await cleanup_func(error))


async def test_join_waits_for_start(decoy: Decoy) -> None:
    """It should wait until the queue is started when join is called."""
    cleanup_func = decoy.mock(name="cleanup_func", is_async=True)
    subject = TaskQueue()  # cleanup_func=cleanup_func)
    subject.set_cleanup_func(func=cleanup_func)
    join_task = asyncio.create_task(subject.join())

    await asyncio.sleep(0)
    assert join_task.done() is False

    subject.start()
    await join_task


async def test_start_runs_stuff_once(decoy: Decoy) -> None:
    """Calling `start` should no-op if already started."""
    run_func = decoy.mock(name="run_func", is_async=True)
    cleanup_func = decoy.mock(name="cleanup_func", is_async=True)

    subject = TaskQueue()  # leanup_func=cleanup_func)
    subject.set_cleanup_func(func=cleanup_func)
    subject.set_run_func(func=run_func)
    subject.start()
    subject.start()
    await subject.join()

    decoy.verify(await run_func(), times=1)
    decoy.verify(await cleanup_func(None), times=1)
