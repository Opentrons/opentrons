"""Timestamp."""
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
        """___str___."""
        return f"[{self._tag}] {self._time}"

    def copy(self, start_time: float = 0) -> "Timestamp":
        """Copy."""
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
        """Copy."""
        return SampleTimestamps(
            tag=self.tag,
            pre_aspirate=self.pre_aspirate.copy(start_time)
            if self.pre_aspirate
            else None,
            aspirate=self.aspirate.copy(start_time) if self.aspirate else None,
            post_aspirate=self.post_aspirate.copy(start_time)
            if self.post_aspirate
            else None,
            pre_dispense=self.pre_dispense.copy(start_time)
            if self.pre_dispense
            else None,
            dispense=self.dispense.copy(start_time) if self.dispense else None,
            post_dispense=self.post_dispense.copy(start_time)
            if self.post_dispense
            else None,
        )

    @classmethod
    def csv_header(cls) -> str:
        """CSV Header."""
        return (
            "tag,"
            "pre-aspirate,pre-aspirate-relative,"
            "aspirate,aspirate-relative,"
            "post-aspirate,post-aspirate-relative,"
            "pre-dispense,pre-dispense-relative,"
            "dispense,dispense-relative,"
            "post-dispense,post-dispense-relative"
        )

    def __str__(self) -> str:
        """__str__."""
        return (
            f"SampleTimestamps ({self.tag}):"
            f"\n\t{self.pre_aspirate}"
            f"\n\t{self.aspirate}"
            f"\n\t{self.post_aspirate}"
            f"\n\t{self.pre_dispense}"
            f"\n\t{self.dispense}"
            f"\n\t{self.post_dispense}"
        )

    def as_csv(self, start_time: float) -> str:
        """As CSV."""
        s = self.copy(start_time)

        def _time_else_none(t: Optional[Timestamp]) -> Optional[float]:
            return t.time if t else None

        return (
            f"{self.tag},"
            f"{_time_else_none(self.pre_aspirate)},{_time_else_none(s.pre_aspirate)},"
            f"{_time_else_none(self.aspirate)},{_time_else_none(s.aspirate)},"
            f"{_time_else_none(self.post_aspirate)},{_time_else_none(s.post_aspirate)},"
            f"{_time_else_none(self.pre_dispense)},{_time_else_none(s.pre_dispense)},"
            f"{_time_else_none(self.dispense)},{_time_else_none(s.dispense)},"
            f"{_time_else_none(self.post_dispense)},{_time_else_none(s.post_dispense)}"
        )


def get_empty_sample_timestamp(tag: str = "") -> SampleTimestamps:
    """Get empty SampleTimestamp."""
    return SampleTimestamps(
        tag=tag,
        pre_aspirate=None,
        aspirate=None,
        post_aspirate=None,
        pre_dispense=None,
        dispense=None,
        post_dispense=None,
    )


def load_pipette_timestamps(file_path: str) -> List[SampleTimestamps]:
    """Load pipette timestamps."""
    with open(file_path, "r") as f:
        stamp_csv_lines = f.readlines()
    assert stamp_csv_lines[0].strip() == SampleTimestamps.csv_header().strip()

    def _stamp(line: List[str], tag: str) -> Timestamp:
        return Timestamp(tag, float(line[csv_header.index(tag)]))

    csv_header = [c for c in SampleTimestamps.csv_header().split(",") if c]
    tag_idx = csv_header.index("tag")
    samples = list()
    for _l in stamp_csv_lines[1:]:
        _line = [v for v in _l.split(",") if v]
        samples.append(
            SampleTimestamps(
                tag=_line[tag_idx],
                pre_aspirate=_stamp(_line, "pre-aspirate"),
                aspirate=_stamp(_line, "aspirate"),
                post_aspirate=_stamp(_line, "post-aspirate"),
                pre_dispense=_stamp(_line, "pre-dispense"),
                dispense=_stamp(_line, "dispense"),
                post_dispense=_stamp(_line, "post-dispense"),
            )
        )
    return samples
