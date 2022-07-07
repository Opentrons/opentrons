from dataclasses import dataclass
from statistics import stdev
from time import time
from typing import List, Optional, Callable

from hardware_testing.drivers.radwag.driver import RadwagScaleBase


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


def record_samples(scale: RadwagScaleBase,
                   length: Optional[int] = None,
                   duration: Optional[float] = None,
                   interval: Optional[float] = None,
                   stable: Optional[bool] = True,
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

    if length and interval and duration:
        raise ValueError(
            'Cannot have all three (length, interval, duration) '
            'arguments set, only use 2 at a time')
    if duration and length:
        interval = duration / (length - 1)
    elif duration and interval:
        length = int(duration / interval) + 1
    if not length or not interval:
        raise ValueError('Cannot record with 2 of the following arguments: '
                         '1) length, 2) interval, or 3) duration')

    _samples = GravimetricRecording()
    _start_time = time()
    while len(_samples) < length and not _did_exceed_time(_start_time, timeout):
        _s = read_sample_from_scale(scale)
        if stable and not _s.stable:
            _samples.clear()  # delete all previously recorded samples
            continue
        iwo = interval - _get_interval_overlap(_samples, interval)
        if not len(_samples) or _did_exceed_time(_samples.end_time, iwo):
            _samples.append(_s)
            if callable(on_new_sample):
                on_new_sample(_samples)
    assert len(_samples) == length, \
        f'Scale recording timed out before accumulating ' \
        f'{length} samples (recorded {len(_samples)} samples)'
    return _samples
