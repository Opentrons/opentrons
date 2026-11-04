from unittest.mock import patch

from hardware_testing.drivers.ImpactProtectionV2 import ImpactProtectionSerial


class FakeSerial:
    def __init__(self, response_chunks: list[bytes]) -> None:
        self.is_open = True
        self._response_chunks = iter(response_chunks)
        self._current_chunk = b""
        self.reset_input_count = 0
        self.reset_output_count = 0
        self.writes: list[bytes] = []

    @property
    def in_waiting(self) -> int:
        if not self._current_chunk:
            self._current_chunk = next(self._response_chunks, b"")
        return len(self._current_chunk)

    def reset_input_buffer(self) -> None:
        self.reset_input_count += 1

    def reset_output_buffer(self) -> None:
        self.reset_output_count += 1

    def write(self, data: bytes) -> int:
        self.writes.append(data)
        return len(data)

    def read(self, size: int) -> bytes:
        result = self._current_chunk[:size]
        self._current_chunk = self._current_chunk[size:]
        return result


def _subject_with_serial(serial: FakeSerial) -> ImpactProtectionSerial:
    subject = ImpactProtectionSerial()
    subject._ser = serial  # type: ignore[assignment]
    return subject


def test_send_returns_immediately_after_ok_response() -> None:
    serial = FakeSerial([b"M18 OK\r\n"])
    subject = _subject_with_serial(serial)

    with patch("hardware_testing.drivers.ImpactProtectionV2.time.sleep") as sleep_mock:
        result = subject._send("M18")

    assert result == "M18 OK"
    assert serial.writes == [b"M18\r\n"]
    assert serial.reset_input_count == 1
    assert serial.reset_output_count == 1
    sleep_mock.assert_not_called()


def test_send_collects_fragmented_response() -> None:
    serial = FakeSerial([b"SET_LEFT_T50 O", b"K\r\n"])
    subject = _subject_with_serial(serial)

    result = subject._send("SET_LEFT_T50")

    assert result == "SET_LEFT_T50 OK"


def test_send_stops_on_wrong_channel_response() -> None:
    serial = FakeSerial([b"Wrong Channel\r\n"])
    subject = _subject_with_serial(serial)

    result = subject._send("SET_LEFT_T50")

    assert result == "Wrong Channel"


def test_send_returns_partial_response_at_timeout() -> None:
    serial = FakeSerial([])
    subject = _subject_with_serial(serial)

    with (
        patch(
            "hardware_testing.drivers.ImpactProtectionV2.time.monotonic",
            side_effect=[0.0, 0.0, 5.1],
        ),
        patch("hardware_testing.drivers.ImpactProtectionV2.time.sleep") as sleep_mock,
    ):
        result = subject._send("M18")

    assert result == ""
    sleep_mock.assert_called_once()


def test_switch_mode_skips_consecutive_duplicate_command() -> None:
    serial = FakeSerial([b"SET_LEFT_T50 OK\r\n"])
    subject = _subject_with_serial(serial)

    first = subject.switch_mode("SET_LEFT_T50")
    second = subject.switch_mode("SET_LEFT_T50")

    assert first.command_sent is True
    assert second.command_sent is False
    assert second.raw_response == "SET_LEFT_T50 OK (cached)"
    assert serial.writes == [b"SET_LEFT_T50\r\n"]


def test_different_state_command_invalidates_previous_cached_state() -> None:
    serial = FakeSerial(
        [
            b"SET_LEFT_T50 OK\r\n",
            b"M18 OK\r\n",
            b"SET_LEFT_T50 OK\r\n",
        ]
    )
    subject = _subject_with_serial(serial)

    subject.switch_mode("SET_LEFT_T50")
    subject.close_all_gratings()
    state = subject.switch_mode("SET_LEFT_T50")

    assert state.command_sent is True
    assert serial.writes == [
        b"SET_LEFT_T50\r\n",
        b"M18\r\n",
        b"SET_LEFT_T50\r\n",
    ]


def test_failed_state_command_is_not_cached() -> None:
    serial = FakeSerial([b"Wrong Channel\r\n", b"SET_LEFT_T50 OK\r\n"])
    subject = _subject_with_serial(serial)

    failed = subject.switch_mode("SET_LEFT_T50")
    retried = subject.switch_mode("SET_LEFT_T50")

    assert failed.command_sent is True
    assert retried.command_sent is True
    assert serial.writes == [b"SET_LEFT_T50\r\n", b"SET_LEFT_T50\r\n"]


def test_close_all_gratings_skips_consecutive_duplicate_command() -> None:
    serial = FakeSerial([b"M18 OK\r\n"])
    subject = _subject_with_serial(serial)

    first = subject.close_all_gratings()
    second = subject.close_all_gratings()

    assert first.command_sent is True
    assert second.command_sent is False
    assert serial.writes == [b"M18\r\n"]


def test_duplicate_state_command_is_sent_again_after_cache_expires() -> None:
    serial = FakeSerial([b"M18 OK\r\n", b"M18 OK\r\n"])
    subject = _subject_with_serial(serial)

    with patch(
        "hardware_testing.drivers.ImpactProtectionV2.time.monotonic",
        side_effect=[0.0, 0.0, 1.0, 1.0, 32.0, 32.0, 33.0, 33.0],
    ):
        first = subject.close_all_gratings()
        second = subject.close_all_gratings()

    assert first.command_sent is True
    assert second.command_sent is True
    assert serial.writes == [b"M18\r\n", b"M18\r\n"]
