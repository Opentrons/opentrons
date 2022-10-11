import asyncio
from typing import AsyncGenerator, Tuple

import pytest
from decoy import Decoy, matchers
from opentrons.hardware_control.poller import Poller, Reader


POLLING_INTERVAL = 0.1


@pytest.fixture
def mock_reader(decoy: Decoy) -> Reader:
    return decoy.mock(cls=Reader)


@pytest.fixture
async def mock_reader_flow_control(
    decoy: Decoy, mock_reader: Reader
) -> Tuple[asyncio.Event, asyncio.Event]:
    read_started_event = asyncio.Event()
    ok_to_finish_read_event = asyncio.Event()

    async def _mock_read() -> None:
        read_started_event.set()
        ok_to_finish_read_event.clear()
        await ok_to_finish_read_event.wait()

    decoy.when(await mock_reader.read()).then_do(_mock_read)

    return (read_started_event, ok_to_finish_read_event)


@pytest.fixture
async def subject(mock_reader: Reader) -> AsyncGenerator[Poller, None]:
    """Create a poller, kicking off the interval and the first read."""
    poller = Poller(reader=mock_reader, interval=POLLING_INTERVAL)
    yield poller
    await poller.stop()


async def test_poller(decoy: Decoy, mock_reader: Reader, subject: Poller) -> None:
    decoy.verify(await mock_reader.read(), times=1)

    await subject.wait_next_poll()
    decoy.verify(await mock_reader.read(), times=2)

    await subject.wait_next_poll()
    decoy.verify(await mock_reader.read(), times=3)


async def test_poller_concurrency(
    mock_reader_flow_control: Tuple[asyncio.Event, asyncio.Event],
    subject: Poller,
) -> None:
    """It should wait for a full poll before notifying."""
    read_started_event, ok_to_finish_read_event = mock_reader_flow_control

    # wait for the first read to start, then subscribe in the middle of the first read
    await read_started_event.wait()
    poll_notification = asyncio.create_task(subject.wait_next_poll())

    # allow the first read to finish, then wait for the second read to start
    read_started_event.clear()
    ok_to_finish_read_event.set()
    await read_started_event.wait()

    # verify that our wait isn't done, because it was kicked off after the first read started
    assert poll_notification.done() is False

    # allow the second read to complete and wait for the third read to start
    read_started_event.clear()
    ok_to_finish_read_event.set()
    await read_started_event.wait()

    # verify the waiter has now been notified since it's been through the full second read
    assert poll_notification.done() is True


async def test_poller_error(decoy: Decoy, mock_reader: Reader, subject: Poller) -> None:
    """It should raise if read errors"""
    decoy.when(await mock_reader.read()).then_raise(RuntimeError("oh no"))

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.wait_next_poll()

    decoy.verify(
        mock_reader.on_error(matchers.ErrorMatching(RuntimeError, match="oh no")),
        times=1,
    )
