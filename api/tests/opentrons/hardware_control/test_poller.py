import asyncio
from typing import AsyncGenerator

import pytest
from decoy import Decoy, matchers
from opentrons.hardware_control.poller import Poller, Reader


POLLING_INTERVAL = 0.1


@pytest.fixture
def mock_reader(decoy: Decoy) -> Reader:
    """Get a mocked out Reader."""
    return decoy.mock(cls=Reader)


@pytest.fixture
async def mock_reader_flow_control(
    decoy: Decoy,
    mock_reader: Reader,
    read_started_event: asyncio.Event,
    ok_to_finish_read_event: asyncio.Event,
) -> None:
    """Configure the Reader with Event flags for controlling read timing."""

    async def _mock_read() -> None:
        read_started_event.set()
        ok_to_finish_read_event.clear()
        await ok_to_finish_read_event.wait()

    decoy.when(await mock_reader.read()).then_do(_mock_read)


@pytest.fixture()
async def read_started_event() -> asyncio.Event:
    """Event to notify a test that a poll has started when using `mock_reader_flow_control`."""
    return asyncio.Event()


@pytest.fixture()
async def ok_to_finish_read_event() -> asyncio.Event:
    """Event to signal a poll to finish when using `mock_reader_flow_control`."""
    return asyncio.Event()


@pytest.fixture
async def subject(
    mock_reader: Reader,
    ok_to_finish_read_event: asyncio.Event,
) -> AsyncGenerator[Poller, None]:
    """Create a poller with a mocked out reader."""
    poller = Poller(reader=mock_reader, interval=POLLING_INTERVAL)
    yield poller
    ok_to_finish_read_event.set()
    await poller.stop()


async def test_poller(decoy: Decoy, mock_reader: Reader, subject: Poller) -> None:
    decoy.verify(await mock_reader.read(), times=0)

    await subject.start()
    decoy.verify(await mock_reader.read(), times=1)

    await subject.wait_next_poll()
    decoy.verify(await mock_reader.read(), times=2)

    await subject.stop()
    decoy.verify(await mock_reader.read(), times=2)


async def test_poller_concurrency(
    mock_reader_flow_control: None,
    read_started_event: asyncio.Event,
    ok_to_finish_read_event: asyncio.Event,
    subject: Poller,
) -> None:
    """It should wait for a full poll before notifying."""
    # wait for the first read to start
    asyncio.create_task(subject.start())
    await asyncio.wait_for(read_started_event.wait(), timeout=4 * subject.interval)

    # subscribe in the middle of the first read
    poll_notification = asyncio.create_task(subject.wait_next_poll())

    # allow the first read to finish, then wait for the second read to start
    read_started_event.clear()
    ok_to_finish_read_event.set()
    await asyncio.wait_for(read_started_event.wait(), timeout=4 * subject.interval)

    # verify that our wait isn't done, because it was kicked off after the first read started
    assert poll_notification.done() is False

    # allow the second read to complete and wait for the third read to start
    read_started_event.clear()
    ok_to_finish_read_event.set()
    await asyncio.wait_for(read_started_event.wait(), timeout=4 * subject.interval)

    # verify the waiter has now been notified since it's been through the full second read
    assert poll_notification.done() is True


async def test_poller_stop_waits_for_poll(
    mock_reader_flow_control: None,
    read_started_event: asyncio.Event,
    ok_to_finish_read_event: asyncio.Event,
    subject: Poller,
) -> None:
    # wait for the first read to start
    asyncio.create_task(subject.start())
    await asyncio.wait_for(read_started_event.wait(), timeout=4 * subject.interval)

    # request a stop in the middle of the first read
    stop_request = asyncio.create_task(subject.stop())
    await asyncio.sleep(4 * subject.interval)
    assert stop_request.done() is False

    ok_to_finish_read_event.set()
    await asyncio.sleep(2 * subject.interval)
    assert stop_request.done() is True


async def test_poller_start_error(
    decoy: Decoy, mock_reader: Reader, subject: Poller
) -> None:
    """It should raise in start if read errors."""
    decoy.when(await mock_reader.read()).then_raise(RuntimeError("oh no"))

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.start()

    decoy.verify(
        mock_reader.on_error(matchers.ErrorMatching(RuntimeError, match="oh no")),
        times=1,
    )


async def test_poller_wait_next_poll_error(
    decoy: Decoy, mock_reader: Reader, subject: Poller
) -> None:
    """It should raise in wait_next_poll if read errors."""
    await subject.start()

    decoy.when(await mock_reader.read()).then_raise(RuntimeError("oh no"))

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.wait_next_poll()

    decoy.verify(
        mock_reader.on_error(matchers.ErrorMatching(RuntimeError, match="oh no")),
        times=1,
    )


async def test_poller_cancelled_wait(
    mock_reader_flow_control: None,
    subject: Poller,
    read_started_event: asyncio.Event,
    ok_to_finish_read_event: asyncio.Event,
) -> None:
    """If one waiter is cancelled, other waiters should still work."""
    asyncio.create_task(subject.start())
    await read_started_event.wait()
    read_started_event.clear()

    # Before letting the read complete, set up new wait tasks
    wait_task_1 = asyncio.create_task(subject.wait_next_poll())
    wait_task_2 = asyncio.create_task(subject.wait_next_poll())
    ok_to_finish_read_event.set()

    await read_started_event.wait()
    read_started_event.clear()
    wait_task_1.cancel()
    ok_to_finish_read_event.set()

    assert (
        subject._poll_forever_task is not None and not subject._poll_forever_task.done()
    )

    await asyncio.sleep(2 * subject.interval)
    assert wait_task_2.done() is True
