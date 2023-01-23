import pytest
import time
import mock
from decoy import Decoy

from typing import Generator
from datetime import datetime

from opentrons.util import helpers
from opentrons.calibration_storage import file_operators
from . import READ_FUNC_TYPE, SAVE_FUNC_TYPE, DELETE_FUNC_TYPE, MOCK_UTC


@pytest.fixture
def mock_timestamp() -> datetime:
    return datetime.fromtimestamp(time.time())


@pytest.fixture
def mock_file_operator_read(decoy: Decoy) -> Generator[READ_FUNC_TYPE, None, None]:
    read_mock = decoy.mock(func=file_operators.read_cal_file)
    with mock.patch.object(file_operators, "read_cal_file", read_mock) as m:
        yield m


@pytest.fixture
def mock_file_operator_save(decoy: Decoy) -> Generator[SAVE_FUNC_TYPE, None, None]:
    save_mock = decoy.mock(func=file_operators.save_to_file)
    with mock.patch.object(file_operators, "save_to_file", save_mock) as m:
        yield m


@pytest.fixture
def mock_file_operator_delete(decoy: Decoy) -> Generator[DELETE_FUNC_TYPE, None, None]:
    delete_mock = decoy.mock(func=file_operators.delete_file)
    with mock.patch.object(file_operators, "delete_file", delete_mock) as m:
        yield m


@pytest.fixture
def mock_file_operator_remove_files(
    decoy: Decoy,
) -> Generator[DELETE_FUNC_TYPE, None, None]:
    delete_mock = decoy.mock(func=file_operators._remove_json_files_in_directories)
    with mock.patch.object(
        file_operators, "_remove_json_files_in_directories", delete_mock
    ) as m:
        yield m


@pytest.fixture
def mock_utc_now(
    decoy: Decoy, mock_timestamp: datetime
) -> Generator[MOCK_UTC, None, None]:
    utc_mock = decoy.mock()
    decoy.when(utc_mock()).then_return(mock_timestamp)
    with mock.patch.object(helpers, "utc_now", utc_mock) as m:
        yield m
