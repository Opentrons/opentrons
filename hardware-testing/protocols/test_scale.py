from dataclasses import dataclass
import time
from typing import List, Optional

from hardware_testing.drivers.radwag.driver import RadwagScale


@dataclass
class GravimetricSample:
    grams: float
    stable: bool
    time: float


def connect_and_initialize_scale() -> RadwagScale:
    scale = RadwagScale.create('COM4')
    scale.connect()
    print(f'Scale serial number: {scale.read_serial_number()}')
    scale.continuous_transmission(enable=False)
    scale.automatic_internal_adjustment(enable=False)
    return scale


def read_sample_from_scale(scale: RadwagScale) -> GravimetricSample:
    g, s = scale.read_mass()
    return GravimetricSample(grams=g, stable=s, time=time.time())


def record_samples(scale: RadwagScale, length: int, interval: float,
                   stable: Optional[bool] = True,
                   timeout: Optional[float] = None) -> List[GravimetricSample]:

    def _did_exceed_time(stamp, period) -> bool:
        if not stamp:
            return True
        if not period:
            return False
        return time.time() > (stamp + period)

    _samples = []
    _start_time = time.time()
    while len(_samples) < length and not _did_exceed_time(_start_time, timeout):
        _s = read_sample_from_scale(scale)
        if stable and not _s.stable:
            _samples = []  # delete all previously recorded samples
            continue
        if not len(_samples) or _did_exceed_time(_samples[-1].time, interval):
            _samples.append(_s)
    assert len(_samples) == length, \
        f'Scale recording timed out before accumulating ' \
        f'{length} samples (recorded {len(_samples)} samples)'
    return _samples


def main() -> None:
    scale = connect_and_initialize_scale()
    samples = record_samples(scale, length=10, interval=0.1, timeout=3)
    print(samples)
    scale.disconnect()


if __name__ == '__main__':
    main()
