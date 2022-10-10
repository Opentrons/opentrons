import pytest
from decoy import Decoy, matchers
from opentrons.hardware_control.poller import Poller, Reader


@pytest.fixture
def mock_reader(decoy: Decoy) -> Reader:
    return decoy.mock(cls=Reader)


async def test_poller(decoy: Decoy, mock_reader: Reader) -> None:
    subject = Poller(reader=mock_reader, interval=0.1)

    await subject.wait_next_poll()
    decoy.verify(await mock_reader.read(), times=1)

    await subject.wait_next_poll()
    decoy.verify(await mock_reader.read(), times=2)


async def test_poller_error(decoy: Decoy, mock_reader: Reader) -> None:
    """It should raise if read errors"""
    decoy.when(await mock_reader.read()).then_raise(RuntimeError("oh no"))

    subject = Poller(reader=mock_reader, interval=0.1)

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.wait_next_poll()

    decoy.verify(
        mock_reader.on_error(matchers.ErrorMatching(RuntimeError, match="oh no")),
        times=1,
    )
