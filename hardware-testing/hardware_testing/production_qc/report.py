import enum
from time import time
from typing import Any, List, Union, Optional

from hardware_testing import data as data_io


class Result(enum.Enum):
    NONE = "NONE"
    SKIP = "SKIP"
    PASS = "PASS"
    FAIL = "FAIL"

    def __str__(self) -> str:
        return self.value


class Line:
    def __init__(self, tag: str, data: List[Any], timestamp: bool = False) -> None:
        self._tag: str = tag
        self._data_types: List[Any] = data
        self._data: List[Any] = [None] * len(data)
        self._add_timestamp: bool = timestamp
        self._timestamp: Optional[float] = None
        self._start_time: Optional[float] = None

    def __str__(self) -> str:
        data_str = ",".join(str(d) for d in self._data)
        if self._add_timestamp:
            data_str = f"{time() - self._start_time},{data_str}"
        return f"{data_str}\n"

    @property
    def tag(self) -> str:
        return self._tag

    def cache_start_time(self, start_time: float) -> None:
        self._start_time = start_time

    def store(self, data: List[Any]):
        self._timestamp = time() - self._start_time
        for i, expected_type in enumerate(self._data_types):
            d_type = type(data[i])
            if d_type != expected_type:
                raise ValueError(f"unexpected data type {d_type} at index {i}")
            self._data[i] = data[i]


class LineTimestamp(Line):
    def __init__(self, tag: str, data: List[Any]) -> None:
        super().__init__(tag, data, timestamp=True)


class LineRepeating:
    def __init__(self, repeat: int, tag: str, data: List[Any], timestamp: bool = False) -> None:
        self._lines: List[Line] = [Line(tag, data, timestamp) for _ in range(repeat)]

    def __getitem__(self, item: int) -> Line:
        return self._lines[item]

    def __str__(self) -> str:
        return "".join([str(line) for line in self._lines])


class Section:
    def __init__(self, title: str, lines: List[Union[Line, LineRepeating]]) -> None:
        self._title = title
        self._lines = lines

    def __getitem__(self, item: str) -> Line:
        for line in self._lines:
            if line.tag == item:
                return line
        raise ValueError(f"unexpected line tag: {item}")

    @property
    def lines(self) -> List[Line]:
        return self.lines

    @property
    def title(self) -> str:
        return self._title


def _generate_meta_data_section() -> Section:
    return Section(
        title="META-DATA",
        lines=[
            Line(
                tag="script-name",
                data=[str]
            ),
            Line(
                tag="test-run-tag",
                data=[str]
            ),
            Line(
                tag="data-time-gmt",
                data=[str]
            )
        ]
    )


class Report:
    def __init__(self, script_path: str, sections: List[Section]) -> None:
        self._script_path = script_path
        self._report_tag: Optional[str] = None
        _meta_data = _generate_meta_data_section()
        self._sections = [_meta_data] + sections

    def __getitem__(self, item: str) -> Section:
        for s in self._sections:
            if s.title == item:
                return s
        raise ValueError(f"unexpected section title: {item}")

    def _cache_start_time(self) -> None:
        start_time = time()
        for section in self._sections:
            for line in section.lines:
                line.cache_start_time(start_time)

    def setup(self, tag: str) -> None:
        self._report_tag = tag
        self._cache_start_time()
        # TODO: setup file here
