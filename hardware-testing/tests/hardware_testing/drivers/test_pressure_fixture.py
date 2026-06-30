"""Pressure fixture tests."""
from unittest.mock import MagicMock

from hardware_testing.drivers.pressure_fixture import PressureFixture


def _pressure_line(start: int, stop: int) -> bytes:
    values = [f"PRESSURE{i}= {i:.2f}" for i in range(start, stop + 1)]
    return (",".join(values) + ",\r\n").encode("utf-8")


def test_read_all_pressure_channel_96_preserves_line_order() -> None:
    """It should not mirror the 12-channel order within each fixture row."""
    connection = MagicMock()
    connection.readlines.return_value = [
        _pressure_line(1, 12),
        _pressure_line(13, 24),
        _pressure_line(25, 36),
        _pressure_line(37, 48),
        _pressure_line(49, 60),
        _pressure_line(61, 72),
        _pressure_line(73, 84),
        _pressure_line(85, 96),
    ]
    subject = PressureFixture(connection=connection, slot_side="left")

    readings = subject.read_all_pressure_channel_96()

    assert readings == [float(i) for i in range(85, 97)] + [
        float(i) for i in range(73, 85)
    ] + [float(i) for i in range(61, 73)] + [
        float(i) for i in range(49, 61)
    ] + [float(i) for i in range(37, 49)] + [
        float(i) for i in range(25, 37)
    ] + [float(i) for i in range(13, 25)] + [
        float(i) for i in range(1, 13)
    ]
    assert readings[0:12] == [float(i) for i in range(85, 97)]
    assert readings[24:36] == [float(i) for i in range(61, 73)]
