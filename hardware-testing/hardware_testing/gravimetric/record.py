from dataclasses import dataclass
from statistics import stdev
from time import time
from typing import List, Optional

from hardware_testing.drivers.radwag.driver import RadwagScaleBase


@dataclass
class GravimetricSample:
    time: float
    grams: float
    stable: bool

    @classmethod
    def csv_header(cls) -> str:
        return 'time,grams,stable'

    def as_csv(self) -> str:
        return f'{self.time},{self.grams},{int(self.stable)}'


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
        csv_file_str = GravimetricSample.csv_header() + '\r\n'
        for s in self:
            csv_file_str += s.as_csv() + '\r\n'
        return csv_file_str + '\r\n'


def read_sample_from_scale(scale: RadwagScaleBase) -> GravimetricSample:
    g, s = scale.read_mass()
    return GravimetricSample(grams=g, stable=s, time=time())


def record_samples(scale: RadwagScaleBase,
                   length: Optional[int] = None,
                   duration: Optional[float] = None,
                   interval: Optional[float] = None,
                   stable: Optional[bool] = True,
                   timeout: Optional[float] = None) -> GravimetricRecording:

    def _did_exceed_time(stamp, period) -> bool:
        if not stamp:
            return True
        if not period:
            return False
        return time() > (stamp + period)

    if length and interval and duration:
        raise ValueError(
            'Cannot have all three (length, interval, duration) '
            'arguments set, only use 2 at a time')
    if duration and length:
        interval = duration / length
    elif duration and interval:
        length = int(duration / interval)
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
        if not len(_samples) or _did_exceed_time(_samples.end_time, interval):
            _samples.append(_s)
    assert len(_samples) == length, \
        f'Scale recording timed out before accumulating ' \
        f'{length} samples (recorded {len(_samples)} samples)'
    return _samples
