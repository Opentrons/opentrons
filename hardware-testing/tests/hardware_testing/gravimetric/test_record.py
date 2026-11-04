"""Tests for gravimetric scale recording."""

from typing import List, cast

import pytest

from hardware_testing.gravimetric.measurement import record as record_module
from hardware_testing.gravimetric.measurement.record import (
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from hardware_testing.gravimetric.measurement.scale import Scale, ScaleReading


class _SteppingMonotonic:
    def __init__(self, step: float = 0.1, start: float = 100.0) -> None:
        self._step = step
        self._value = start - step

    def __call__(self) -> float:
        self._value += self._step
        return self._value


class _FakeScale:
    def __init__(self, wall_times: List[float]) -> None:
        self._wall_times = iter(wall_times)

    @property
    def is_simulator(self) -> bool:
        return True

    def connect(self) -> None:
        pass

    def disconnect(self) -> None:
        pass

    def initialize(self) -> None:
        pass

    def read_serial_number(self) -> str:
        return "fake-scale"

    def read_max_capacity(self) -> float:
        return 220.0

    def read(self) -> ScaleReading:
        return ScaleReading(grams=1.0, stable=True, time=next(self._wall_times))


def test_recording_continues_when_wall_clock_moves_backwards(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A system clock correction must not stop scale sampling."""
    wall_times = [50_000.0, 21_200.0, 21_200.2]
    monkeypatch.setattr(record_module, "monotonic", _SteppingMonotonic())
    monkeypatch.setattr(record_module, "time", lambda: wall_times[0])
    recorder = GravimetricRecorder(
        cfg=GravimetricRecorderConfig(duration=0.4, frequency=5),
        scale=cast(Scale, _FakeScale(wall_times)),
        start_graph=False,
    )

    recorder.record()

    recorded_times = [sample.time for sample in recorder.recording]
    assert len(recorded_times) == len(wall_times)
    assert recorded_times == sorted(recorded_times)
    assert recorded_times[-1] - recorded_times[0] < 1
