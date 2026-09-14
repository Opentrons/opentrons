from types import SimpleNamespace
from unittest.mock import patch

import pytest

from hardware_testing.drivers.LCUS_4 import (
    CMD_FAN_OFF,
    CMD_FAN_ON,
    CMD_HELP,
    CMD_STATUS,
    CMD_VERSION,
    LCUS4Error,
    LCUS4Serial,
    LCUS4Simulate,
    _command_for_channel,
    _parse_status_response,
)


class FakeSerial:
    def __init__(
        self, response_chunks: list[bytes] | None = None, port: str = ""
    ) -> None:
        self.is_open = True
        self.port = port
        self._response_chunks = iter(response_chunks or [])
        self._current_chunk = b""
        self.reset_input_count = 0
        self.reset_output_count = 0
        self.writes: list[bytes] = []
        self.closed = False

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

    def close(self) -> None:
        self.closed = True
        self.is_open = False


def test_command_frames_use_documented_fan_commands() -> None:
    assert _command_for_channel(1, True) == b"FAN_ON\r\n"
    assert _command_for_channel(1, False) == b"FAN_OFF\r\n"


def test_only_fan_channel_is_exposed() -> None:
    with pytest.raises(LCUS4Error):
        _command_for_channel(2, True)
    with pytest.raises(LCUS4Error):
        _command_for_channel(3, True)


def test_status_parser_accepts_fan_command_responses() -> None:
    assert _parse_status_response("STATUS FAN_ON\r\n") == {1: True}
    assert _parse_status_response("FAN: OFF\r\n") == {1: False}
    assert _parse_status_response("FAN_STATUS: ON\r\n") == {1: True}


def test_serial_set_channel_sends_ascii_frame_with_newline() -> None:
    serial = FakeSerial()
    subject = LCUS4Serial()
    subject._ser = serial  # type: ignore[assignment]
    subject.port = "/dev/test"

    state = subject.channel_1_on()

    assert state.enabled is True
    assert state.command == CMD_FAN_ON
    assert serial.writes == [CMD_FAN_ON]
    assert serial.reset_input_count == 1
    assert serial.reset_output_count == 1


def test_fan_aliases_send_on_and_off_commands() -> None:
    serial = FakeSerial()
    subject = LCUS4Serial()
    subject._ser = serial  # type: ignore[assignment]
    subject.port = "/dev/test"

    subject.fan_on()
    subject.fan_off()

    assert serial.writes == [CMD_FAN_ON, CMD_FAN_OFF]


def test_serial_get_status_sends_status_and_parses_response() -> None:
    serial = FakeSerial([b"STATUS FAN_ON\r\n"])
    subject = LCUS4Serial()
    subject._ser = serial  # type: ignore[assignment]
    subject.port = "/dev/test"

    status = subject.get_status()

    assert serial.writes == [CMD_STATUS]
    assert status.channels == {1: True}
    assert status.channel_1 is True
    assert status.channel_2 is False


def test_connect_accepts_only_a_port_with_fan_status() -> None:
    wrong = FakeSerial([b"NOT_LCUS\r\n"], port="/dev/wrong")
    target = FakeSerial(
        [b"STATUS FAN_OFF\r\n", b"STATUS FAN_OFF\r\n"],
        port="/dev/target",
    )
    ports = [
        SimpleNamespace(device="/dev/wrong"),
        SimpleNamespace(device="/dev/target"),
    ]

    with (
        patch("hardware_testing.drivers.LCUS_4.comports", return_value=ports),
        patch(
            "hardware_testing.drivers.LCUS_4.serial.Serial",
            side_effect=[wrong, target],
        ),
        patch(
            "hardware_testing.drivers.LCUS_4._port_is_open_in_this_process",
            return_value=False,
        ),
        patch("hardware_testing.drivers.LCUS_4.time.sleep"),
        patch("hardware_testing.drivers.LCUS_4.COMMAND_RESPONSE_TIMEOUT_SECONDS", 0.01),
    ):
        subject = LCUS4Serial()
        assert subject.connect() is True

    assert subject.port == "/dev/target"
    assert wrong.closed is True
    assert subject.get_status().channel_1 is False


def test_simulator_tracks_fan_state() -> None:
    subject = LCUS4Simulate()

    assert subject.get_status().channels == {1: False}
    subject.channel_1_on()
    subject.channel_1_off()

    assert subject.get_status().channels == {1: False}


def test_serial_version_and_help_commands_return_text() -> None:
    serial = FakeSerial(
        [b"VERSION FAN_1.0.0\r\n", b"FAN_ON FAN_OFF STATUS VERSION HELP\r\n"]
    )
    subject = LCUS4Serial()
    subject._ser = serial  # type: ignore[assignment]
    subject.port = "/dev/test"

    assert subject.get_version() == "FAN 1.0.0"
    assert subject.get_help() == "FAN_ON FAN_OFF STATUS VERSION HELP"
    assert serial.writes == [CMD_VERSION, CMD_HELP]
