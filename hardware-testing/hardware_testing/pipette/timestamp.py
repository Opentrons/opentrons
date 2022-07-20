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
    pre_aspirate: Optional[Timestamp]
    aspirate: Optional[Timestamp]
    post_aspirate: Optional[Timestamp]
    pre_dispense: Optional[Timestamp]
    dispense: Optional[Timestamp]
    post_dispense: Optional[Timestamp]

    def __str__(self) -> str:
        return f'SampleTimestamps:' \
               f'\n\t{self.pre_aspirate}' \
               f'\n\t{self.aspirate}' \
               f'\n\t{self.post_aspirate}' \
               f'\n\t{self.pre_dispense}' \
               f'\n\t{self.dispense}' \
               f'\n\t{self.post_dispense}'


def get_empty_sample_timestamp() -> SampleTimestamps:
    """Get empty SampleTimestamp."""
    return SampleTimestamps(pre_aspirate=None, aspirate=None, post_aspirate=None,
                            pre_dispense=None, dispense=None, post_dispense=None)
