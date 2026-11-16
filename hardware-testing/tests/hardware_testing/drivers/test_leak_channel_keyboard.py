"""Numeric channel entry consumes Linux input events without real hardware."""

from collections import defaultdict, deque
from typing import Callable
from unittest.mock import MagicMock

import pytest

from hardware_testing.drivers import liquid_calibration_keyboard as driver


class EventFeed:
    """Provide deterministic timestamps, key state and complete event batches."""

    def __init__(self) -> None:
        """Initialize one monotonic clock and independent interface queues."""
        self.now = 100.0
        self.pending: dict[int, deque[bytes]] = defaultdict(deque)
        self.held: dict[int, set[int]] = defaultdict(set)
        self.notices = MagicMock()

    def read(self, fd: int, length: int) -> bytes:
        """Return a queued batch or the normal nonblocking empty result."""
        if self.pending[fd]:
            return self.pending[fd].popleft()
        raise BlockingIOError()

    def ioctl(self, fd: int, request: int, argument: object) -> int:
        """Emulate the initial held-key bitmap without issuing a real ioctl."""
        if request == driver.LiquidCalibrationKeyboard.KEY_STATE:
            assert isinstance(argument, bytearray)
            for code in self.held[fd]:
                argument[code // 8] |= 1 << (code % 8)
        return 0

    def batch(self, events: list[tuple[int, int, int, float]], fd: int = 10) -> None:
        """Queue explicit kind/code/value/timestamp events on one interface."""
        self.pending[fd].append(
            b"".join(
                driver.LiquidCalibrationKeyboard.EVENT.pack(
                    int(timestamp),
                    round((timestamp % 1) * 1_000_000),
                    kind,
                    code,
                    value,
                )
                for kind, code, value, timestamp in events
            )
        )

    def keys(self, codes: list[int], fd: int = 10) -> None:
        """Queue physical press and release pairs with increasing times."""
        events = []
        for code in codes:
            self.now += 0.01
            events.extend(((1, code, 1, self.now), (1, code, 0, self.now)))
        self.batch(events, fd)
        self.now += 0.01

    def keyboard(self, fd: int = 10) -> driver.ChannelSelectionKeyboard:
        """Construct a channel reader that cannot control a physical device."""
        return driver.ChannelSelectionKeyboard(
            fd, "test keypad", num_led=False, notice=self.notices
        )


@pytest.fixture
def feed(monkeypatch: pytest.MonkeyPatch) -> EventFeed:
    """Mock every device operation used by the channel reader."""
    events = EventFeed()
    monkeypatch.setattr(driver, "monotonic", lambda: events.now)
    monkeypatch.setattr(driver.os, "read", events.read)
    monkeypatch.setattr(driver.os, "close", MagicMock())
    monkeypatch.setattr(driver.fcntl, "ioctl", events.ioctl)
    return events


@pytest.mark.parametrize(
    "codes", [list(range(2, 10)), [79, 80, 81, 75, 76, 77, 71, 72]]
)
def test_one_fast_batch_keeps_every_digit(feed: EventFeed, codes: list[int]) -> None:
    """Main and keypad digits survive one read containing the whole answer."""
    keyboard = feed.keyboard()
    feed.keys([*codes, 96])
    result = keyboard.poll()
    assert result is not None
    assert result[0] == "CHANNELS:12345678"
    assert keyboard.poll() is None


def test_digits_are_kept_between_poll_calls(feed: EventFeed) -> None:
    """Typing in separate batches still produces a single complete answer."""
    keyboard = feed.keyboard()
    feed.keys([2, 3])
    assert keyboard.poll() is None
    feed.keys([4, 28])
    assert keyboard.poll()[0] == "CHANNELS:123"  # type: ignore[index]
    feed.keys([28])
    assert keyboard.poll()[0] == "CHANNELS:"  # type: ignore[index]


@pytest.mark.parametrize(
    "code, character",
    [(11, "0"), (10, "9"), (83, "."), (78, "+"), (74, "-"), (30, "a"), (57, " ")],
)
def test_invalid_characters_are_not_silently_removed(
    feed: EventFeed, code: int, character: str
) -> None:
    """The protocol must see and reject invalid answers such as 1.3."""
    keyboard = feed.keyboard()
    feed.keys([2, code, 4, 28])
    assert keyboard.poll()[0] == f"CHANNELS:1{character}3"  # type: ignore[index]


def test_unknown_key_is_an_invalid_character(feed: EventFeed) -> None:
    """Unsupported control keys cannot disappear into a valid channel answer."""
    keyboard = feed.keyboard()
    feed.keys([2, 59, 28])
    assert keyboard.poll()[0] == "CHANNELS:1?"  # type: ignore[index]


def test_backspace_and_escape_edit_the_answer(feed: EventFeed) -> None:
    """Backspace removes one entry and Escape clears without submitting."""
    keyboard = feed.keyboard()
    feed.keys([2, 3, 14, 4, 28])
    assert keyboard.poll()[0] == "CHANNELS:13"  # type: ignore[index]
    feed.keys([2, 3, 1, 5, 28])
    assert keyboard.poll()[0] == "CHANNELS:4"  # type: ignore[index]
    feed.keys([1, 14, 28])
    assert keyboard.poll()[0] == "CHANNELS:"  # type: ignore[index]


def test_extra_submission_in_same_batch_is_discarded(feed: EventFeed) -> None:
    """A second queued answer cannot be reused as the next operator response."""
    keyboard = feed.keyboard()
    feed.keys([2, 28, 3, 28, 4])
    assert keyboard.poll()[0] == "CHANNELS:1"  # type: ignore[index]
    feed.keys([5, 28])
    assert keyboard.poll()[0] == "CHANNELS:4"  # type: ignore[index]


def test_same_poll_drains_multiple_kernel_read_batches(feed: EventFeed) -> None:
    """Queued read boundaries do not turn an answer into separate submissions."""
    keyboard = feed.keyboard()
    feed.keys([2, 3])
    feed.keys([4, 28])
    feed.keys([5, 28])
    assert keyboard.poll()[0] == "CHANNELS:123"  # type: ignore[index]
    feed.keys([28])
    assert keyboard.poll()[0] == "CHANNELS:"  # type: ignore[index]


def test_split_interfaces_share_buffer_in_timestamp_order(feed: EventFeed) -> None:
    """Digit and Enter interfaces are merged by event time, not file order."""
    keyboard = feed.keyboard()
    child = feed.keyboard(11)
    keyboard._children = [child]
    feed.keys([2], fd=11)
    feed.keys([3], fd=10)
    feed.keys([4, 28], fd=11)
    assert keyboard.poll()[0] == "CHANNELS:123"  # type: ignore[index]


def test_repeat_held_and_stale_events_do_not_add_digits(feed: EventFeed) -> None:
    """Only a fresh down edge after release contributes a digit or submission."""
    feed.held[10] = {2}
    keyboard = feed.keyboard()
    feed.batch(
        [
            (1, 2, 1, 100.1),
            (1, 2, 2, 100.2),
            (1, 2, 0, 100.3),
            (1, 3, 1, 99.0),
            (1, 3, 0, 100.4),
            (1, 2, 1, 100.5),
            (1, 2, 2, 100.6),
            (1, 2, 0, 100.7),
            (1, 28, 1, 100.8),
        ]
    )
    feed.now = 101.0
    assert keyboard.poll()[0] == "CHANNELS:1"  # type: ignore[index]


def test_modifier_held_before_open_does_not_turn_symbol_into_digit(
    feed: EventFeed,
) -> None:
    """An already-held Shift key still makes Shift+1 an invalid channel entry."""
    feed.held[10] = {42}
    keyboard = feed.keyboard()
    feed.keys([2, 28])
    assert keyboard.poll()[0] == "CHANNELS:?"  # type: ignore[index]


def test_num_lock_is_independent_of_answer(feed: EventFeed) -> None:
    """Num Lock can be toggled without submitting or corrupting the digits."""
    keyboard = feed.keyboard()
    toggle = MagicMock()
    keyboard._toggle_num_lock = toggle  # type: ignore[method-assign]
    feed.keys([79, 69, 80, 69, 96])
    assert keyboard.poll()[0] == "CHANNELS:12"  # type: ignore[index]
    assert toggle.call_count == 2


def test_reconnection_starts_empty(feed: EventFeed) -> None:
    """An unfinished answer belongs only to the previous physical session."""
    keyboard = feed.keyboard()
    feed.keys([2, 3])
    assert keyboard.poll() is None
    feed.pending[10].append(b"")
    with pytest.raises(OSError, match="disconnected"):
        keyboard.poll()
    keyboard.close()
    replacement = feed.keyboard(11)
    feed.keys([4, 28], fd=11)
    assert replacement.poll()[0] == "CHANNELS:3"  # type: ignore[index]


def test_dropped_events_cannot_produce_an_incomplete_valid_answer(
    feed: EventFeed,
) -> None:
    """Event loss invalidates buffered digits until the operator edits the entry."""
    keyboard = feed.keyboard()
    feed.keys([2])
    assert keyboard.poll() is None
    feed.batch([(0, 3, 0, 100.1), (0, 0, 0, 100.2)])
    feed.now = 101.0
    assert keyboard.poll() is None
    feed.keys([4, 28])
    assert keyboard.poll()[0] == "CHANNELS:?3"  # type: ignore[index]


@pytest.mark.parametrize(
    "factory, code, command",
    [(driver.LiquidCalibrationKeyboard, 72, "UP"), (driver.YesNoKeyboard, 28, "YES")],
)
def test_existing_reader_commands_are_unchanged(
    feed: EventFeed,
    factory: Callable[..., driver.LiquidCalibrationKeyboard],
    code: int,
    command: str,
) -> None:
    """The channel reader does not change calibration or Yes/No key mappings."""
    keyboard = factory(10, "existing reader", num_led=False)
    feed.keys([code])
    assert keyboard.poll()[0] == command  # type: ignore[index]
