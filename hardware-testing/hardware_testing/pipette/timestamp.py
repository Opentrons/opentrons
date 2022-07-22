from dataclasses import dataclass
from time import time
from typing import Optional, List


@dataclass
class Timestamp:
    """Timestamp."""

    def __init__(self, tag: str, t: Optional[float] = None) -> None:
        """Timestamp."""
        self._tag = tag
        self._time = time() if t is None else t

    def __str__(self) -> str:
        return f'[{self._tag}] {self._time}'

    def copy(self, start_time: float = 0) -> "Timestamp":
        return Timestamp(self.tag, self.time - start_time)

    @property
    def tag(self) -> str:
        """Tag."""
        return self._tag

    @property
    def time(self) -> float:
        """Time."""
        return self._time


@dataclass
class SampleTimestamps:
    """SampleTimestamps."""
    tag: str
    pre_aspirate: Optional[Timestamp]
    aspirate: Optional[Timestamp]
    post_aspirate: Optional[Timestamp]
    pre_dispense: Optional[Timestamp]
    dispense: Optional[Timestamp]
    post_dispense: Optional[Timestamp]

    def copy(self, start_time: float = 0) -> "SampleTimestamps":
        return SampleTimestamps(
            tag=self.tag,
            pre_aspirate=self.pre_aspirate.copy(start_time) if self.pre_aspirate else None,
            aspirate=self.aspirate.copy(start_time) if self.aspirate else None,
            post_aspirate=self.post_aspirate.copy(start_time) if self.post_aspirate else None,
            pre_dispense=self.pre_dispense.copy(start_time) if self.pre_dispense else None,
            dispense=self.dispense.copy(start_time) if self.dispense else None,
            post_dispense=self.post_dispense.copy(start_time) if self.post_dispense else None,
        )

    @classmethod
    def csv_header(cls) -> str:
        """CSV Header."""
        return 'tag,' \
               'pre-aspirate,pre-aspirate-relative,' \
               'aspirate,aspirate-relative' \
               'post-aspirate,post-aspirate-relative' \
               'pre-dispense,pre-dispense-relative' \
               'dispense,dispense-relative' \
               'post-dispense,post-dispense-relative'

    def __str__(self) -> str:
        return f'SampleTimestamps ({self.tag}):' \
               f'\n\t{self.pre_aspirate}' \
               f'\n\t{self.aspirate}' \
               f'\n\t{self.post_aspirate}' \
               f'\n\t{self.pre_dispense}' \
               f'\n\t{self.dispense}' \
               f'\n\t{self.post_dispense}'

    def as_csv(self, start_time: float) -> str:
        """As CSV."""
        rel_self = self.copy(start_time)
        return f'{self.tag},' \
               f'{self.pre_aspirate.time},{rel_self.pre_aspirate.time},' \
               f'{self.aspirate.time},{rel_self.aspirate.time},' \
               f'{self.post_aspirate.time},{rel_self.post_aspirate.time},' \
               f'{self.pre_dispense.time},{rel_self.pre_dispense.time},' \
               f'{self.dispense.time},{rel_self.dispense.time},' \
               f'{self.post_dispense.time},{rel_self.post_dispense.time}'


def get_empty_sample_timestamp(tag: str = '') -> SampleTimestamps:
    """Get empty SampleTimestamp."""
    return SampleTimestamps(tag=tag,
                            pre_aspirate=None, aspirate=None, post_aspirate=None,
                            pre_dispense=None, dispense=None, post_dispense=None)
