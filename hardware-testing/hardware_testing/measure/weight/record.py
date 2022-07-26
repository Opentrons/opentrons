"""Record weight measurements."""
from dataclasses import dataclass
from statistics import stdev
from threading import Thread, Event
from time import sleep, time
from typing import List, Optional, Callable

from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import (
    dump_data_to_file,
    append_data_to_file,
    create_file_name,
)

from .scale import Scale

SLEEP_TIME_IN_RECORD_LOOP = 0.01


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

    def as_csv(self, start_time: float) -> str:
        """Get data as a single CSV line."""
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
        split_lines = [line.strip().split(",") for line in lines[1:] if line]
        return GravimetricRecording(
            [
                GravimetricSample(
                    time=float(split_line[time_idx]),
                    grams=float(split_line[grams_idx]),
                    stable=bool(int(split_line[stable_idx])),
                )
                for split_line in split_lines
                if len(split_line) > 1
            ]
        )

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

    def as_csv(self, start_time: float) -> str:
        """Convert the recording into a string that can be saved to a CSV file."""
        csv_file_str = GravimetricSample.csv_header() + "\n"
        for s in self:
            csv_file_str += s.as_csv(start_time) + "\n"
        return csv_file_str + "\n"

    def _get_nearest_sample_index(self, _time: float) -> int:
        if _time < self.start_time or _time > self.end_time:
            raise ValueError(f"Time ({_time}) is not within recording")
        for i in range(len(self) - 1):
            diff_before = _time - self[i].time
            diff_after = self[i + 1].time - _time
            if diff_before >= 0 and diff_after >= 0:
                if diff_before < diff_after:
                    return i
                else:
                    return i + 1
        raise ValueError(f"Unable to find time ({_time}) in recording (start={self.start_time}, end={self.end_time})")

    def get_time_slice(
        self, start: float, duration: float, stable: bool = False, timeout: float = 3
    ) -> "GravimetricRecording":
        """Get time slice."""
        assert len(self), "Cannot slice an empty recording"
        avail_start_idx = self._get_nearest_sample_index(start)
        avail_timeout_idx = self._get_nearest_sample_index(start + timeout)
        available_samples = GravimetricRecording(self[avail_start_idx:avail_timeout_idx])
        if not stable:
            end_idx = available_samples._get_nearest_sample_index(duration)
            return GravimetricRecording(available_samples[:end_idx + 1])
        else:
            # only include the first stable segment of samples
            # once the samples become unstable, stop including
            stable_samples = GravimetricRecording()
            for s in available_samples:
                if s.stable:
                    stable_samples.append(s)
                    if stable_samples.duration >= duration:
                        return stable_samples
                elif len(stable_samples):
                    stable_samples = GravimetricRecording()
        raise RuntimeError(f"Unable to slice recording "
                           f"(start={start}, duration={duration})")


class GravimetricRecorderConfig:
    """Recording config."""

    def __init__(
        self,
        duration: float,
        frequency: float,
        stable: bool = False,
        test_name: Optional[str] = None,
        run_id: Optional[str] = None,
        tag: Optional[str] = None,
        start_time: Optional[float] = None,
    ) -> None:
        """Recording config."""
        self.duration = duration
        self.frequency = frequency
        self.stable = stable
        self.test_name = test_name
        self.run_id = run_id
        self.tag = tag
        self.start_time = start_time

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

    def __init__(self, ctx: ProtocolContext, cfg: GravimetricRecorderConfig) -> None:
        """Gravimetric Recorder."""
        self._ctx = ctx
        self._cfg = cfg
        self._scale: Scale = Scale.build(ctx=ctx)
        self._recording = GravimetricRecording()
        self._is_recording = Event()
        self._reading_samples = Event()
        self._thread: Optional[Thread] = None
        super().__init__()
        self.activate()

    @property
    def tag(self) -> str:
        """Tag."""
        return f"{self.__class__.__name__}-{self._cfg.tag}"

    @property
    def config(self) -> GravimetricRecorderConfig:
        """Config."""
        return self._cfg

    def activate(self) -> None:
        """Activate."""
        self._scale.connect()
        self._scale.initialize()
        self._scale.tare(0.0)

    def deactivate(self) -> None:
        """Deactivate."""
        self._scale.disconnect()

    def set_tag(self, tag: str) -> None:
        """Set tag."""
        self._cfg.tag = tag

    def set_frequency(self, frequency: float) -> None:
        """Set frequency."""
        self._cfg.frequency = frequency

    def set_stable(self, stable: bool) -> None:
        """Set stable."""
        self._cfg.stable = stable

    def set_duration(self, duration: float) -> None:
        """Set stable."""
        self._cfg.duration = duration

    def calibrate_scale(self) -> None:
        """Calibrate scale."""
        self._scale.calibrate()

    def record(self, in_thread: bool = False) -> None:
        """Record."""
        if in_thread:
            assert not self.is_in_thread
            if self._is_recording.is_set():
                self._is_recording.clear()
            self._thread = Thread(target=self.run)
            self._thread.start()  # creates the thread
            self._is_recording.set()
            self._reading_samples.wait()
            assert self.is_in_thread
        else:
            if not self._is_recording.is_set():
                self._is_recording.set()
            self.run()

    def run(self) -> None:
        """Run."""
        self._wait_for_record_start()
        if self._cfg.save_to_disk:
            self._recording = self._record_samples_to_disk()
        else:
            self._recording = self._record_samples()
        self._is_recording.clear()

    @property
    def recording(self) -> GravimetricRecording:
        """Recording."""
        return self._recording

    @property
    def is_recording(self) -> bool:
        """Is Recording."""
        return self._is_recording.is_set()

    @property
    def is_in_thread(self) -> bool:
        """Is in thread."""
        return self._thread is not None and self._thread.is_alive()

    def stop(self) -> None:
        """Stop."""
        self._is_recording.clear()
        if self._thread and self.is_in_thread:
            self._thread.join()

    def _wait_for_record_start(self) -> None:
        if not self.is_recording:
            self._is_recording.wait()

    def _record_samples(
        self,
        timeout: Optional[float] = None,
        on_new_sample: Optional[Callable] = None,
    ) -> GravimetricRecording:
        """Record samples from the scale."""
        assert self._cfg.duration or self.is_in_thread
        assert self._cfg.frequency
        if self._cfg.duration:
            length = int(self._cfg.duration * self._cfg.frequency) + 1
        else:
            length = 0
        interval = 1.0 / self._cfg.frequency
        _recording = GravimetricRecording()
        _start_time = time()
        while self.is_recording:
            if length and len(_recording) >= length:
                break
            if _record_did_exceed_time(_start_time, timeout):
                break
            self._reading_samples.set()
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
            if self.is_in_thread:
                sleep(SLEEP_TIME_IN_RECORD_LOOP)
        self._reading_samples.clear()
        assert len(_recording) == length or not self.is_recording, (
            f"Scale recording timed out before accumulating "
            f"{length} samples (recorded {len(_recording)} samples)"
        )
        return _recording

    def _record_samples_to_disk(
        self, timeout: Optional[float] = None
    ) -> GravimetricRecording:
        """Record samples to disk."""
        assert self._cfg.test_name, "A test-name is required to record samples"
        assert self._cfg.tag, "A tag is required to record samples"
        assert self._cfg.start_time
        assert self._cfg.run_id
        _file_name = create_file_name(self._cfg.test_name, self._cfg.run_id, self.tag)

        def _on_new_sample(recording: GravimetricRecording) -> None:
            csv_line = recording[-1].as_csv(self._cfg.start_time)
            append_data_to_file(str(self._cfg.test_name), _file_name, csv_line + "\n")

        # add the header to the CSV file
        dump_data_to_file(
            self._cfg.test_name, _file_name, GravimetricSample.csv_header() + "\n"
        )
        _rec = self._record_samples(timeout=timeout, on_new_sample=_on_new_sample)
        # add a final newline character to the CSV file
        append_data_to_file(self._cfg.test_name, _file_name, "\n")
        return _rec
