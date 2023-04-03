"""CSV Report."""
from datetime import datetime
import enum
from pathlib import Path
from time import time
from typing import Any, List, Union, Optional

from hardware_testing import data as data_io


class CSVResult(enum.Enum):
    """CSV Result."""

    PASS = "PASS"
    FAIL = "FAIL"

    def __bool__(self) -> bool:
        """Bool."""
        return self.value == self.PASS.value  # type: ignore[attr-defined]

    def __str__(self) -> str:
        """String."""
        return self.value

    @classmethod
    def from_bool(cls, b: bool) -> "CSVResult":
        """From bool."""
        return cls.PASS if b else cls.FAIL


def print_csv_result(test: str, result: CSVResult) -> None:
    """Print CSV Result."""
    if bool(result):
        highlight = ""
    else:
        highlight = "\t\t<-- !!! failure"
    print(f"RESULT: {test} - {result}{highlight}\n")


META_DATA_TITLE = "META-DATA"
META_DATA_TEST_NAME = "test-name"
META_DATA_TEST_TAG = "test-tag"
META_DATA_TEST_RUN_ID = "test-run-id"
META_DATA_TEST_TIME_UTC = "test-time-utc"
META_DATA_TEST_OPERATOR = "test-operator"
META_DATA_TEST_VERSION = "test-version"

RESULTS_OVERVIEW_TITLE = "RESULTS-OVERVIEW"


class CSVLine:
    """CSV Line."""

    def __init__(self, tag: str, data: List[Any]) -> None:
        """CSV Line init."""
        self._tag: str = tag
        self._data_types: List[Any] = data
        self._data: List[Any] = [None] * len(data)
        self._elapsed_time: Optional[float] = None
        self._start_time: Optional[float] = None
        self._stored = False

    def __str__(self) -> str:
        """CSV Line string."""
        data_str = ",".join(str(d) for d in self._data)
        full_str = f"{self._tag},{data_str}"
        _elapsed: Optional[float] = None
        if self._elapsed_time is not None:
            _elapsed = round(self._elapsed_time, 1)
        return f"{_elapsed},{full_str}"

    @property
    def data(self) -> List[Any]:
        """Data."""
        return self._data

    @property
    def tag(self) -> str:
        """Line tag."""
        return self._tag

    @property
    def timestamp(self) -> Optional[float]:
        """Line timestamp."""
        return self._elapsed_time

    @property
    def stored(self) -> bool:
        """Line stored."""
        return self._stored

    def cache_start_time(self, start_time: float) -> None:
        """Line cache start time."""
        self._start_time = start_time

    @property
    def result(self) -> Optional[CSVResult]:
        """Line result passed."""
        for i, expected_type in enumerate(self._data_types):
            if expected_type == CSVResult:
                return self._data[i]
        return None

    @property
    def result_passed(self) -> bool:
        """Line result passed."""
        for i, expected_type in enumerate(self._data_types):
            if expected_type == CSVResult and self._data[i] != CSVResult.PASS:
                return False
        return True

    def store(self, *data: Any, print_results: bool = True) -> None:
        """Line store data."""
        if len(data) != len(self._data_types):
            raise ValueError(
                f"[{self.tag}] unexpected data length ({len(data)}), "
                f"should equal {len(self._data_types)}"
            )
        assert self._start_time, "no start time saved"
        self._elapsed_time = time() - self._start_time
        for i, expected_type in enumerate(self._data_types):
            try:
                self._data[i] = expected_type(data[i])
            except ValueError:
                raise ValueError(
                    f"[{self.tag}] unexpected data type {type(data[i])} "
                    f'with value "{data[i]}" at index {i}'
                )
        self._stored = True
        if print_results and CSVResult in self._data_types:
            print_csv_result(self.tag, CSVResult.from_bool(self.result_passed))


class CSVLineRepeating:
    """CSV Line Repeating."""

    def __init__(self, repeat: int, tag: str, data: List[Any]) -> None:
        """CSV Line Repeating init."""
        self._lines: List[CSVLine] = [CSVLine(tag, data) for _ in range(repeat)]

    @property
    def tag(self) -> str:
        """CSV Line Repeating tag."""
        return self._lines[0].tag

    def __len__(self) -> int:
        """CSV Line Repeating length."""
        return len(self._lines)

    @property
    def stored(self) -> bool:
        """CSV Line Repeating is stored."""
        for line in self._lines:
            if not line.stored:
                return False
        return True

    @property
    def result_passed(self) -> bool:
        """CSV Line Repeating result passed."""
        for line in self._lines:
            if not line.result_passed:
                return False
        return True

    def __getitem__(self, item: int) -> CSVLine:
        """CSV Line Repeating get item."""
        return self._lines[item]

    def __str__(self) -> str:
        """CSV Line Repeating string."""
        return "\n".join([str(line) for line in self._lines])


class CSVSection:
    """CSV Section."""

    def __init__(
        self, title: str, lines: List[Union[CSVLine, CSVLineRepeating]]
    ) -> None:
        """CSV Section init."""
        self._title = title
        self._lines_and_repeating_lines = lines

    def __getitem__(self, item: str) -> Union[CSVLine, CSVLineRepeating]:
        """CSV Section get item."""
        for line in self._lines_and_repeating_lines:
            if line.tag == item:
                return line
        raise ValueError(f"[{self._title}] unexpected line tag: {item}")

    def _get_earliest_line_timestamp(self) -> Optional[float]:
        all_lines: List[CSVLine] = []
        for line in self._lines_and_repeating_lines:
            if isinstance(line, CSVLineRepeating):
                for i in range(len(line)):
                    all_lines.append(line[i])
            else:
                all_lines.append(line)
        stamps = [line.timestamp for line in all_lines if line.timestamp is not None]
        min_timestamp: Optional[float] = None
        if stamps:
            min_timestamp = min(
                [line.timestamp for line in self.lines if line.timestamp is not None]
            )
            min_timestamp = round(min_timestamp, 1)
        return min_timestamp

    def __str__(self) -> str:
        """CSV Section string."""
        dashes = "-" * len(self.title)
        lines = "\n".join([str(line) for line in self._lines_and_repeating_lines])
        min_timestamp = self._get_earliest_line_timestamp()
        return (
            f"{min_timestamp},{dashes}\n" f"{min_timestamp},{self.title}\n" f"{lines}"
        )

    @property
    def lines(self) -> List[CSVLine]:
        """CSV Section lines."""
        all_lines: List[CSVLine] = list()
        for line in self._lines_and_repeating_lines:
            if isinstance(line, CSVLineRepeating):
                for i in range(len(line)):
                    all_lines.append(line[i])
            else:
                all_lines.append(line)
        return all_lines

    @property
    def title(self) -> str:
        """CSV Section title."""
        return self._title

    @property
    def completed(self) -> bool:
        """CSV Section completed."""
        for line in self.lines:
            if not line.stored:
                return False
        return True

    @property
    def result_passed(self) -> bool:
        """CSV Section result passed."""
        for line in self.lines:
            if not line.result_passed:
                return False
        return True


def _generate_meta_data_section() -> CSVSection:
    return CSVSection(
        title=META_DATA_TITLE,
        lines=[
            CSVLine(tag=META_DATA_TEST_NAME, data=[str]),
            CSVLine(tag=META_DATA_TEST_TAG, data=[str]),
            CSVLine(tag=META_DATA_TEST_RUN_ID, data=[str]),
            CSVLine(tag=META_DATA_TEST_TIME_UTC, data=[str]),
            CSVLine(tag=META_DATA_TEST_OPERATOR, data=[str]),
            CSVLine(tag=META_DATA_TEST_VERSION, data=[str]),
        ],
    )


def _generate_results_overview_section(tags: List[str]) -> CSVSection:
    return CSVSection(
        title=RESULTS_OVERVIEW_TITLE,
        lines=[CSVLine(tag=tag, data=[CSVResult]) for tag in tags],
    )


class CSVReport:
    """CSV Report."""

    def __init__(
        self,
        test_name: str,
        sections: List[CSVSection],
        run_id: Optional[str] = None,
        start_time: Optional[float] = None,
    ) -> None:
        """CSV Report init."""
        self._test_name = test_name
        self._run_id = run_id if run_id else data_io.create_run_id()
        self._tag: Optional[str] = None
        self._file_name: Optional[str] = None
        _section_meta = _generate_meta_data_section()
        _section_titles = [s.title for s in sections]
        _section_results = _generate_results_overview_section(_section_titles)
        self._sections = [_section_meta, _section_results] + sections
        self._cache_start_time(start_time)  # must happen before storing any data
        self(META_DATA_TITLE, META_DATA_TEST_NAME, [self._test_name])
        self(META_DATA_TITLE, META_DATA_TEST_RUN_ID, [self._run_id])
        _now = datetime.utcnow().strftime("%Y/%m/%d-%H:%M:%S")
        self(META_DATA_TITLE, META_DATA_TEST_TIME_UTC, [_now])

    def __call__(self, *args: Any) -> None:
        """CSV Report call."""
        if len(args) == 3:
            line = self[args[0]][args[1]]
            if isinstance(line, CSVLineRepeating):
                raise ValueError(f'line "{args[1]}" is repeating, and must be indexed')
            line.store(*args[2])
        elif len(args) == 4:
            r_line = self[args[0]][args[1]]
            if not isinstance(r_line, CSVLineRepeating):
                raise ValueError(
                    f'line "{args[1]}" is not a repeating line and cannot be indexed'
                )
            r_line[args[2]].store(*args[3])
        else:
            raise ValueError(f"unexpected arguments to Report(): {args}")
        # set the results of each section based on current
        self._refresh_results_overview_values()
        # save to disk after storing new values
        if self._file_name:
            self.save_to_disk()

    def __getitem__(self, item: str) -> CSVSection:
        """CSV Report get item."""
        for s in self._sections:
            if s.title == item:
                return s
        raise ValueError(f"unexpected section title: {item}")

    def _refresh_results_overview_values(self) -> None:
        for s in self._sections[2:]:
            section = self[RESULTS_OVERVIEW_TITLE]
            line = section[s.title]
            assert isinstance(line, CSVLine)
            line.store(CSVResult.PASS, print_results=False)
            if s.result_passed:
                result = CSVResult.PASS
            else:
                result = CSVResult.FAIL
            line.store(result, print_results=False)

    def __str__(self) -> str:
        """CSV Report string."""
        return "\n".join([str(s) for s in self._sections])

    @property
    def completed(self) -> bool:
        """CSV Report completed."""
        for s in self._sections:
            if not s.completed:
                return False
        return True

    @property
    def parent(self) -> Path:
        """Parent directory of this report file."""
        return data_io.create_folder_for_test_data(self._test_name)

    @property
    def tag(self) -> str:
        """Tag."""
        return f"{self.__class__.__name__}-{self._tag}"

    def _cache_start_time(self, start_time: Optional[float] = None) -> None:
        checked_start_time = start_time if start_time else time()
        for section in self._sections:
            for line in section.lines:
                if isinstance(line, CSVLineRepeating):
                    for i in range(len(line)):
                        line[i].cache_start_time(checked_start_time)
                else:
                    line.cache_start_time(checked_start_time)

    def set_tag(self, tag: str) -> None:
        """CSV Report set tag."""
        self._tag = tag
        self(META_DATA_TITLE, META_DATA_TEST_TAG, [self._tag])
        self._file_name = data_io.create_file_name(
            self._test_name, self._run_id, self.tag
        )
        self.save_to_disk()

    def set_operator(self, operator: str) -> None:
        """Set operator."""
        self(META_DATA_TITLE, META_DATA_TEST_OPERATOR, [operator])

    def set_version(self, version: str) -> None:
        """Set version."""
        self(META_DATA_TITLE, META_DATA_TEST_VERSION, [version])

    def save_to_disk(self) -> Path:
        """CSV Report save to disk."""
        if not self._file_name:
            raise RuntimeError("must set tag of report using `Report.set_tag()`")
        _report_str = str(self)
        assert self._file_name, "must set tag before saving to disk"
        return data_io.dump_data_to_file(
            self._test_name, self._file_name, _report_str + "\n"
        )
