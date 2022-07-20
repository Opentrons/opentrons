"""Record weight measurements."""
from dataclasses import dataclass
from statistics import stdev
from time import time
from typing import List, Optional, Callable

from opentrons.protocol_api import ProtocolContext

from hardware_testing.drivers import RadwagScaleBase, SimRadwagScale
from hardware_testing.data import (
    dump_data_to_file,
    append_data_to_file,
    create_file_name,
)

from .scale import Scale


@dataclass
class GravimetricSample:
    """Class to store individual scale readings."""

    time: float
    grams: float
    stable: bool

    @classmethod
    def csv_header(cls) -> str:
        """Get CSV header line."""
        return "time,relative-time,grams,unstable-grams,stable-grams,stable"

    def as_csv(self, parent: Optional["GravimetricRecording"] = None) -> str:
        """Get data as a single CSV line."""
        start_time = parent.start_time if parent else self.time
        rel_time = self.relative_time(start_time)
        unstable_grams = str(self.grams) if not self.stable else ""
        stable_grams = str(self.grams) if self.stable else ""
        return (
            f"{self.time},{rel_time},{self.grams},"
            f"{unstable_grams},{stable_grams},{int(self.stable)}"
        )

    def relative_time(self, start_time: float) -> float:
        """Get the sample's relative time in seconds, from a starting time."""
        return self.time - start_time

    def relative_grams(self, start_grams: float) -> float:
        """Get a sample's relative weight in grams, from a starting weight."""
        return self.grams - start_grams


class GravimetricRecording(List):
    """Gravimetric Recording."""

    def __str__(self) -> str:
        """Get string."""
        return (
            f"GravimetricRecording("
            f"length={len(self)}, "
            f"duration={round(self.duration, 2)}, "
            f"start_time={self.start_time})"
        )

    @classmethod
    def load(cls, file_path: str) -> "GravimetricRecording":
        """Build a GravimetricRecording instance."""
        with open(file_path, "r") as f:
            lines = f.readlines()

        if len(lines) <= 1:
            raise FileNotFoundError(f'File has no data saved yet: "{file_path}"')
        expected_header = GravimetricSample.csv_header()
        assert expected_header.strip() == lines[0].strip()
        header_list = expected_header.split(",")
        time_idx = header_list.index("time")
        grams_idx = header_list.index("grams")
        stable_idx = header_list.index("stable")
        split_lines = [
            line.strip().split(',') for line in lines[1:] if line
        ]
        return GravimetricRecording([
            GravimetricSample(
                time=float(split_line[time_idx]),
                grams=float(split_line[grams_idx]),
                stable=bool(int(split_line[stable_idx])),
            )
            for split_line in split_lines
            if len(split_line) > 1
        ])

    @property
    def start_time(self) -> float:
        """Get the starting time, in seconds."""
        assert len(self), "No samples recorded"
        return self[0].time

    @property
    def end_time(self) -> float:
        """Get the ending time, in seconds."""
        assert len(self), "No samples recorded"
        return self[-1].time

    @property
    def start_grams(self) -> float:
        """Get the starting weight, in grams."""
        assert len(self), "No samples recorded"
        return self[0].grams

    @property
    def end_grams(self) -> float:
        """Get the ending weight, in grams."""
        assert len(self), "No samples recorded"
        return self[-1].grams

    @property
    def duration(self) -> float:
        """Get the recording time duration, in seconds."""
        return self.end_time - self.start_time

    @property
    def grams_as_list(self) -> List[float]:
        """Get the recorded weights as a list of floats."""
        return [s.grams for s in self]

    @property
    def average(self) -> float:
        """Get the average weight of the recording, in grams."""
        assert len(self), "No samples recorded"
        _grams_list = self.grams_as_list
        return sum(_grams_list) / len(_grams_list)

    @property
    def stdev(self) -> float:
        """Get the standard deviation of the recording."""
        assert len(self), "No samples recorded"
        return stdev(self.grams_as_list)

    def calculate_cv(self) -> float:
        """Calculate the percent CV of the recording."""
        return self.stdev / self.average

    def calculate_d(self, target: float) -> float:
        """Calculate the percent D of the recording."""
        return (self.average - target) / target

    def as_csv(self) -> str:
        """Convert the recording into a string that can be saved to a CSV file."""
        csv_file_str = GravimetricSample.csv_header() + "\n"
        for s in self:
            csv_file_str += s.as_csv(self) + "\n"
        return csv_file_str + "\n"


class RecordConfig:
    """Recording config."""

    def __init__(
        self,
        duration: float,
        frequency: float,
        stable: bool = False,
        test_name: Optional[str] = None,
        tag: Optional[str] = None,
    ) -> None:
        """Recording config."""
        self.duration = duration
        self.frequency = frequency
        self.stable = stable
        self.test_name = test_name
        self.tag = tag

    @property
    def save_to_disk(self) -> bool:
        """Save to disk."""
        return bool(self.test_name and self.tag)


def _record_get_remaining_time(stamp: float, period: float) -> float:
    return (stamp + period) - time()


def _record_did_exceed_time(stamp: float, period: Optional[float] = None) -> bool:
    if not stamp:
        return True
    if not period:
        return False
    return _record_get_remaining_time(stamp, period) <= 0


def _record_get_interval_overlap(samples: GravimetricRecording, period: float) -> float:
    if len(samples) < 2:
        return 0
    real_time = samples.duration
    ideal_time = (len(samples) - 1) * period
    return real_time - ideal_time


class GravimetricRecorder:
    """Gravimetric Recorder."""

    def __init__(self, ctx: ProtocolContext, test_name: str) -> None:
        """Gravimetric Recorder."""
        self._ctx = ctx
        self._cfg = RecordConfig(test_name=test_name, duration=1.0, frequency=10)
        self._scale: Scale = Scale.build(ctx=ctx)
        self._active = False

    @property
    def active(self) -> bool:
        """Active."""
        return self._active

    @property
    def config(self) -> RecordConfig:
        """Config."""
        return self._cfg

    def activate(self) -> None:
        """Activate."""
        if self.active:
            return
        self._scale.connect()
        self._scale.initialize()
        self._scale.tare(0.0)
        self._active = True

    def deactivate(self) -> None:
        """Deactivate."""
        if not self.active:
            return
        self._scale.disconnect()
        self._active = False

    def set_tag(self, tag: str) -> None:
        """Set tag."""
        self._cfg.tag = tag

    def set_frequency(self, frequency: float) -> None:
        """Set frequency."""
        self._cfg.frequency = frequency

    def set_stable(self, stable: bool) -> None:
        """Set stable."""
        self._cfg.stable = stable

    def calibrate_scale(self) -> None:
        """Calibrate scale."""
        self._scale.calibrate()

    def record(self, duration: Optional[float] = None) -> GravimetricRecording:
        """Record."""
        if duration is not None:
            self._cfg.duration = duration
        if self._cfg.save_to_disk:
            return self._record_samples_to_disk()
        else:
            return self._record_samples()

    def _record_samples(
            self,
            timeout: Optional[float] = None,
            on_new_sample: Optional[Callable] = None,
    ) -> GravimetricRecording:
        """Record samples from the scale."""
        assert self._cfg.duration
        assert self._cfg.frequency
        length = int(self._cfg.duration * self._cfg.frequency) + 1
        interval = 1.0 / self._cfg.frequency
        _recording = GravimetricRecording()
        _start_time = time()
        while len(_recording) < length and not _record_did_exceed_time(
                _start_time, timeout
        ):
            mass = self._scale.read()
            _s = GravimetricSample(grams=mass.grams, stable=mass.stable, time=mass.time)
            if self._cfg.stable and not _s.stable:
                _recording.clear()  # delete all previously recorded samples
                continue
            interval_w_overlap = interval - _record_get_interval_overlap(
                _recording, interval
            )
            if not len(_recording) or _record_did_exceed_time(
                    _recording.end_time, interval_w_overlap
            ):
                _recording.append(_s)
                if callable(on_new_sample):
                    on_new_sample(_recording)
        assert len(_recording) == length, (
            f"Scale recording timed out before accumulating "
            f"{length} samples (recorded {len(_recording)} samples)"
        )
        return _recording

    def _record_samples_to_disk(self, timeout: Optional[float] = None) -> GravimetricRecording:
        """Record samples to disk."""
        assert self._cfg.test_name
        assert self._cfg.tag
        _file_name = create_file_name(self._cfg.test_name, self._cfg.tag)

        def _on_new_sample(recording: GravimetricRecording) -> None:
            append_data_to_file(
                str(self._cfg.test_name), _file_name, recording[-1].as_csv(recording) + "\n"
            )

        # add the header to the CSV file
        dump_data_to_file(
            self._cfg.test_name, _file_name, GravimetricSample.csv_header() + "\n"
        )
        _recording = self._record_samples(
            timeout=timeout, on_new_sample=_on_new_sample)
        # add a final newline character to the CSV file
        append_data_to_file(self._cfg.test_name, _file_name, "\n")
        return _recording
