from dataclasses import dataclass
from time import time
from typing import Optional


@dataclass
class Timestamp:
    """Timestamp."""

    def __init__(self, tag: str) -> None:
        """Timestamp."""
        self._tag = tag
        self._time = time()

    def __str__(self) -> str:
        return f'[{self._tag}] {self._time}'

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

    @classmethod
    def csv_header(cls) -> str:
        """CSV Header."""
        return 'pre-aspirate,aspirate,post-aspirate,' \
               'pre-dispense,dispense,post-dispense'

    def __str__(self) -> str:
        return f'SampleTimestamps ({self.tag}):' \
               f'\n\t{self.pre_aspirate}' \
               f'\n\t{self.aspirate}' \
               f'\n\t{self.post_aspirate}' \
               f'\n\t{self.pre_dispense}' \
               f'\n\t{self.dispense}' \
               f'\n\t{self.post_dispense}'

    def as_csv(self) -> str:
        """As CSV."""
        return f'{self.tag},' \
               f'{self.pre_aspirate},{self.aspirate},{self.post_aspirate},' \
               f'{self.pre_dispense},{self.dispense},{self.post_dispense}'


def get_empty_sample_timestamp(tag: str = '') -> SampleTimestamps:
    """Get empty SampleTimestamp."""
    return SampleTimestamps(tag=tag,
                            pre_aspirate=None, aspirate=None, post_aspirate=None,
                            pre_dispense=None, dispense=None, post_dispense=None)
