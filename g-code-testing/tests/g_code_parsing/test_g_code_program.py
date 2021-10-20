from typing import Generator, Iterator

import pytest
from opentrons.hardware_control.emulation.settings import Settings

from g_code_parsing import g_code_watcher
from g_code_parsing.g_code import GCode
from g_code_parsing.g_code_program.g_code_program import (
    GCodeProgram,
)
from g_code_parsing.errors import PollingGCodeAdditionError


@pytest.fixture
def watcher() -> Iterator[g_code_watcher.GCodeWatcher]:
    def temp_return(self):
        return [
            g_code_watcher.WatcherData("M400", "smoothie", "ok\r\nok\r\n"),
            g_code_watcher.WatcherData(
                "M105", "tempdeck", "T:86.500 C:66.223\r\nok\r\nok\r\n"
            ),
            g_code_watcher.WatcherData("M400", "smoothie", "ok\r\nok\r\n"),
            g_code_watcher.WatcherData(
                "M119", "thermocycler", "Lid:open\r\nok\r\nok\r\n"
            ),
            g_code_watcher.WatcherData(
                "M105", "thermocycler", "T:40.000 C:23.823\r\nok\r\nok\r\n"
            ),
            g_code_watcher.WatcherData(
                "M141", "thermocycler", "T:40.0 C:23.700\r\nok\r\nok\r\n"
            ),
            g_code_watcher.WatcherData("M400", "smoothie", "ok\r\nok\r\n"),
        ]

    old_function = g_code_watcher.GCodeWatcher.get_command_list
    g_code_watcher.GCodeWatcher.get_command_list = temp_return  # type: ignore

    yield g_code_watcher.GCodeWatcher(emulator_settings=Settings())
    g_code_watcher.GCodeWatcher = old_function  # type: ignore


@pytest.fixture
def polling_command() -> GCode:
    return GCode.from_raw_code(
        "M141", "thermocycler", "T:40.0 C:23.700\r\nok\r\nok\r\n"
    )[0]


def test_filter_codes(watcher):
    actual_codes = [
        g_code.g_code for g_code in GCodeProgram.from_g_code_watcher(watcher).g_codes
    ]
    expected_codes = ["M400", "M400", "M400"]

    assert actual_codes == expected_codes


def test_add_code_polling_command(polling_command):
    program = GCodeProgram()
    with pytest.raises(PollingGCodeAdditionError):
        program.add_g_code(polling_command)


def test_add_codes_polling_command(polling_command):
    program = GCodeProgram()
    with pytest.raises(PollingGCodeAdditionError):
        program.add_g_codes([polling_command, polling_command])
