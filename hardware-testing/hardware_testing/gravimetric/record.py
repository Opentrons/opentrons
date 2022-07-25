"""Gravimetric recording module."""
from dataclasses import dataclass
from statistics import stdev
from time import time
from typing import List, Optional, Callable

from hardware_testing.drivers.radwag.driver import RadwagScaleBase
from hardware_testing.data import (
    dump_data_to_file,
    append_data_to_file,
    create_file_name,
)


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
    """Class to store a list of GravimetricSample instances."""

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
        recording = GravimetricRecording()
        for line in lines[1:]:  # skip the header
            if not line:
                continue
            line_list = line.strip().split(",")
            if len(line) <= 1:
                continue
            recording.append(
                GravimetricSample(
                    time=float(line_list[time_idx]),
                    grams=float(line_list[grams_idx]),
                    stable=bool(int(line_list[stable_idx])),
                )
            )
        return recording

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


def read_sample_from_scale(scale: RadwagScaleBase) -> GravimetricSample:
    """Read a single sample from a scale."""
    g, s = scale.read_mass()
    return GravimetricSample(grams=g, stable=s, time=time())


@dataclass
class RecordConfig:
    """Recording config."""

    length: Optional[int]
    duration: Optional[float]
    interval: Optional[float]
    stable: Optional[bool]


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


def _record_validate_config(config: RecordConfig) -> RecordConfig:
    if config.length and config.interval and config.duration:
        raise ValueError(
            "Cannot have all three (length, interval, duration) "
            "arguments set, only use 2 at a time"
        )
    if config.duration and config.length:
        config.interval = config.duration / (config.length - 1)
    elif config.duration and config.interval:
        config.length = int(config.duration / config.interval) + 1
    if not config.length or not config.interval:
        raise ValueError(
            "Cannot record with 2 of the following arguments: "
            "1) length, 2) interval, or 3) duration"
        )
    return config


def record_samples(
    scale: RadwagScaleBase,
    config: RecordConfig,
    timeout: Optional[float] = None,
    on_new_sample: Optional[Callable] = None,
) -> GravimetricRecording:
    """Record samples from the scale."""
    _cfg = _record_validate_config(config)
    assert _cfg.length
    assert _cfg.interval
    _samples = GravimetricRecording()
    _start_time = time()
    while len(_samples) < _cfg.length and not _record_did_exceed_time(
        _start_time, timeout
    ):
        _s = read_sample_from_scale(scale)
        if _cfg.stable and not _s.stable:
            _samples.clear()  # delete all previously recorded samples
            continue
        interval_w_overlap = _cfg.interval - _record_get_interval_overlap(
            _samples, _cfg.interval
        )
        if not len(_samples) or _record_did_exceed_time(
            _samples.end_time, interval_w_overlap
        ):
            _samples.append(_s)
            if callable(on_new_sample):
                on_new_sample(_samples)
    assert len(_samples) == _cfg.length, (
        f"Scale recording timed out before accumulating "
        f"{_cfg.length} samples (recorded {len(_samples)} samples)"
    )
    return _samples


@dataclass
class RecordToDiskConfig:
    """Record to disk config."""

    record_config: RecordConfig
    test_name: str
    tag: str


def record_samples_to_disk(
    scale: RadwagScaleBase, config: RecordToDiskConfig, timeout: Optional[float] = None
) -> GravimetricRecording:
    """Record samples to disk."""
    _file_name = create_file_name(config.test_name, config.tag)

    def _on_new_sample(recording: GravimetricRecording) -> None:
        append_data_to_file(
            config.test_name, _file_name, recording[-1].as_csv(recording) + "\n"
        )

    # add the header to the CSV file
    dump_data_to_file(
        config.test_name, _file_name, GravimetricSample.csv_header() + "\n"
    )
    _recording = record_samples(
        scale, config.record_config, timeout=timeout, on_new_sample=_on_new_sample
    )
    # add a final newline character to the CSV file
    append_data_to_file(config.test_name, _file_name, "\n")
    return _recording
