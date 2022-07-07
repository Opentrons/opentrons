from dataclasses import dataclass
from statistics import stdev
from time import time
from typing import List, Optional, Callable

from hardware_testing.drivers.radwag.driver import RadwagScaleBase
from hardware_testing.data import dump_data_to_file, append_data_to_file, create_file_name


@dataclass
class GravimetricSample:
    time: float
    grams: float
    stable: bool

    @classmethod
    def csv_header(cls) -> str:
        return 'time,relative-time,grams,unstable-grams,stable-grams,stable'

    def as_csv(self, parent: Optional["GravimetricRecording"] = None) -> str:
        rel_time = self.relative_time(parent.start_time)
        unstable_grams = str(self.grams) if not self.stable else ''
        stable_grams = str(self.grams) if self.stable else ''
        return f'{self.time},{rel_time},{self.grams},' \
               f'{unstable_grams},{stable_grams},{int(self.stable)}'

    def relative_time(self, start_time: float) -> float:
        return self.time - start_time

    def relative_grams(self, start_grams: float) -> float:
        return self.grams - start_grams


@dataclass
class GravimetricRecording(List):

    def __str__(self):
        return f'GravimetricRecording(' \
               f'length={len(self)}, ' \
               f'duration={round(self.duration, 2)}, ' \
               f'start_time={self.start_time})'

    @property
    def start_time(self) -> float:
        assert len(self), 'No samples recorded'
        return self[0].time

    @property
    def end_time(self) -> float:
        assert len(self), 'No samples recorded'
        return self[-1].time

    @property
    def start_grams(self) -> float:
        assert len(self), 'No samples recorded'
        return self[0].grams

    @property
    def end_grams(self) -> float:
        assert len(self), 'No samples recorded'
        return self[-1].grams

    @property
    def duration(self) -> float:
        return self.end_time - self.start_time

    @property
    def grams_as_list(self) -> List[float]:
        return [s.grams for s in self]

    @property
    def average(self) -> float:
        assert len(self), 'No samples recorded'
        _grams_list = self.grams_as_list
        return sum(_grams_list) / len(_grams_list)

    @property
    def stdev(self) -> float:
        assert len(self), 'No samples recorded'
        return stdev(self.grams_as_list)

    def calculate_cv(self) -> float:
        return self.stdev / self.average

    def calculate_d(self, target: float) -> float:
        return (self.average - target) / target

    def as_csv(self) -> str:
        csv_file_str = GravimetricSample.csv_header() + '\n'
        for s in self:
            csv_file_str += s.as_csv(self) + '\n'
        return csv_file_str + '\n'


def read_sample_from_scale(scale: RadwagScaleBase) -> GravimetricSample:
    g, s = scale.read_mass()
    return GravimetricSample(grams=g, stable=s, time=time())


@dataclass
class RecordConfig:
    length: Optional[int]
    duration: Optional[float]
    interval: Optional[float]
    stable: Optional[bool]


def record_samples(scale: RadwagScaleBase,
                   config: RecordConfig,
                   timeout: Optional[float] = None,
                   on_new_sample: Optional[Callable] = None) -> GravimetricRecording:

    def _get_remaining_time(stamp: float, period: float) -> float:
        return (stamp + period) - time()

    def _did_exceed_time(stamp: float, period: float) -> bool:
        if not stamp:
            return True
        if not period:
            return False
        return _get_remaining_time(stamp, period) <= 0

    def _get_interval_overlap(samples: GravimetricRecording, period: float):
        if len(samples) < 2:
            return 0
        real_time = samples.duration
        ideal_time = (len(samples) - 1) * period
        return real_time - ideal_time

    if config.length and config.interval and config.duration:
        raise ValueError(
            'Cannot have all three (length, interval, duration) '
            'arguments set, only use 2 at a time')
    if config.duration and config.length:
        config.interval = config.duration / (config.length - 1)
    elif config.duration and config.interval:
        config.length = int(config.duration / config.interval) + 1
    if not config.length or not config.interval:
        raise ValueError('Cannot record with 2 of the following arguments: '
                         '1) length, 2) interval, or 3) duration')

    _samples = GravimetricRecording()
    _start_time = time()
    while len(_samples) < config.length and not _did_exceed_time(_start_time, timeout):
        _s = read_sample_from_scale(scale)
        if config.stable and not _s.stable:
            _samples.clear()  # delete all previously recorded samples
            continue
        iwo = config.interval - _get_interval_overlap(_samples, config.interval)
        if not len(_samples) or _did_exceed_time(_samples.end_time, iwo):
            _samples.append(_s)
            if callable(on_new_sample):
                on_new_sample(_samples)
    assert len(_samples) == config.length, \
        f'Scale recording timed out before accumulating ' \
        f'{config.length} samples (recorded {len(_samples)} samples)'
    return _samples


@dataclass
class RecordToDiskConfig:
    record_config: RecordConfig
    test_name: str
    tag: str


def record_samples_to_disk(scale: RadwagScaleBase,
                           config: RecordToDiskConfig,
                           timeout: Optional[float] = None) -> GravimetricRecording:
    _file_name = create_file_name(config.test_name, config.tag)

    def _on_new_sample(recording: GravimetricRecording) -> None:
        append_data_to_file(config.test_name, _file_name,
                            recording[-1].as_csv(recording) + '\n')

    # add the header to the CSV file
    dump_data_to_file(config.test_name, _file_name,
                      GravimetricSample.csv_header() + '\n')
    _recording = record_samples(scale, config.record_config,
                                timeout=timeout, on_new_sample=_on_new_sample)
    # add a final newline character to the CSV file
    append_data_to_file(config.test_name, _file_name, '\n')
    return _recording
