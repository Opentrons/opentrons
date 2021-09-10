import tempfile
import os
import pytest

from typing import List
from opentrons.hardware_control.emulation.settings import SmoothieSettings
from g_code_parsing.cli import (
    GCodeCLI,
    RunCommand,
    DiffCommand,
)
from g_code_parsing.errors import UnparsableCLICommandError
from g_code_parsing.g_code_program.supported_text_modes import (
    SupportedTextModes,
)


VALIDATION_PROTOCOL_NAME = "protocol_smoothie"
VALIDATION_HTTP_NAME = 'http_home_robot'
DEFAULT_LEFT_PIPETTE = SmoothieSettings().left
DEFAULT_RIGHT_PIPETTE = SmoothieSettings().right

DIFF_FILE_PATH_1 = os.path.join(tempfile.gettempdir(), "file_1.txt")
DIFF_FILE_PATH_2 = os.path.join(tempfile.gettempdir(), "file_2.txt")


@pytest.fixture
def setup_same_files():
    with open(DIFF_FILE_PATH_1, "w") as file_1, open(DIFF_FILE_PATH_2, "w") as file_2:
        file_1.write("Hello World")
        file_2.write("Hello World")


@pytest.fixture
def setup_different_files():
    with open(DIFF_FILE_PATH_1, "w") as file_1, open(DIFF_FILE_PATH_2, "w") as file_2:
        file_1.write("Hello World")
        file_2.write("Hello")


def run_cli_inputs():
    return [
        ["run", VALIDATION_PROTOCOL_NAME],
        ["run", VALIDATION_PROTOCOL_NAME, "--text-mode", "Default"],
        [
            "run",
            VALIDATION_PROTOCOL_NAME,
            "--left-pipette",
            '{"model": "p20_single_v2.0", "id": "P20SV202020070101"}',
        ],
        [
            "run",
            VALIDATION_PROTOCOL_NAME,
            "--right-pipette",
            '{"model": "p20_multi_v2.0", "id": "P3HMV202020041605"}',
        ],
        ["run", VALIDATION_HTTP_NAME]
    ]


def diff_cli_input():
    return [["diff", DIFF_FILE_PATH_1, DIFF_FILE_PATH_2]]


def run_expected_args():
    return [
        {
            "command": "run",
            "configuration_name": VALIDATION_PROTOCOL_NAME,
            "text_mode": SupportedTextModes.CONCISE.value,
            "left_pipette": DEFAULT_LEFT_PIPETTE,
            "right_pipette": DEFAULT_RIGHT_PIPETTE,
        },
        {
            "command": "run",
            "configuration_name": VALIDATION_PROTOCOL_NAME,
            "text_mode": SupportedTextModes.DEFAULT.value,
            "left_pipette": DEFAULT_LEFT_PIPETTE,
            "right_pipette": DEFAULT_RIGHT_PIPETTE,
        },
        {
            "command": "run",
            "configuration_name": VALIDATION_PROTOCOL_NAME,
            "text_mode": SupportedTextModes.CONCISE.value,
            "left_pipette": DEFAULT_RIGHT_PIPETTE,
            "right_pipette": DEFAULT_RIGHT_PIPETTE,
        },
        {
            "command": "run",
            "configuration_name": VALIDATION_PROTOCOL_NAME,
            "text_mode": SupportedTextModes.CONCISE.value,
            "left_pipette": DEFAULT_LEFT_PIPETTE,
            "right_pipette": DEFAULT_LEFT_PIPETTE,
        },
        {
            "command": "run",
            "configuration_name": VALIDATION_HTTP_NAME,
            "text_mode": SupportedTextModes.CONCISE.value,
            "left_pipette": DEFAULT_LEFT_PIPETTE,
            "right_pipette": DEFAULT_RIGHT_PIPETTE,
        },
    ]


def diff_expected_args():
    return [
        {
            "command": "diff",
            "error_on_different_files": False,
            "file_path_1": DIFF_FILE_PATH_1,
            "file_path_2": DIFF_FILE_PATH_2,
        }
    ]


def run_expected_commands() -> List[RunCommand]:
    return [
        RunCommand(
            configuration_name=VALIDATION_PROTOCOL_NAME,
            text_mode=SupportedTextModes.CONCISE.value,
            left_pipette_config=DEFAULT_LEFT_PIPETTE,
            right_pipette_config=DEFAULT_RIGHT_PIPETTE,
        ),
        RunCommand(
            configuration_name=VALIDATION_PROTOCOL_NAME,
            text_mode=SupportedTextModes.DEFAULT.value,
            left_pipette_config=DEFAULT_LEFT_PIPETTE,
            right_pipette_config=DEFAULT_RIGHT_PIPETTE,
        ),
        RunCommand(
            configuration_name=VALIDATION_PROTOCOL_NAME,
            text_mode=SupportedTextModes.CONCISE.value,
            left_pipette_config=DEFAULT_RIGHT_PIPETTE,
            right_pipette_config=DEFAULT_RIGHT_PIPETTE,
        ),
        RunCommand(
            configuration_name=VALIDATION_PROTOCOL_NAME,
            text_mode=SupportedTextModes.CONCISE.value,
            left_pipette_config=DEFAULT_LEFT_PIPETTE,
            right_pipette_config=DEFAULT_LEFT_PIPETTE,
        ),
        RunCommand(
            configuration_name=VALIDATION_HTTP_NAME,
            text_mode=SupportedTextModes.CONCISE.value,
            left_pipette_config=DEFAULT_LEFT_PIPETTE,
            right_pipette_config=DEFAULT_RIGHT_PIPETTE,
        ),
    ]


def diff_expected_command():
    return [
        DiffCommand(
            file_path_1=DIFF_FILE_PATH_1,
            file_path_2=DIFF_FILE_PATH_2,
            able_to_respond_with_error_code=False,
        )
    ]


def run_commands() -> List[RunCommand]:
    return[
        RunCommand(
            configuration_name=VALIDATION_PROTOCOL_NAME,
            text_mode=SupportedTextModes.CONCISE.value,
            left_pipette_config=DEFAULT_RIGHT_PIPETTE,
            right_pipette_config=DEFAULT_RIGHT_PIPETTE,
        ),
        RunCommand(
            configuration_name=VALIDATION_HTTP_NAME,
            text_mode=SupportedTextModes.CONCISE.value,
            left_pipette_config=DEFAULT_RIGHT_PIPETTE,
            right_pipette_config=DEFAULT_RIGHT_PIPETTE,
        )
    ]


@pytest.fixture
def same_file_content_diff_command(setup_same_files) -> DiffCommand:
    return DiffCommand(
        file_path_1=DIFF_FILE_PATH_1,
        file_path_2=DIFF_FILE_PATH_2,
        able_to_respond_with_error_code=True,
    )


@pytest.fixture
def different_file_content_diff_command(setup_different_files) -> DiffCommand:
    return DiffCommand(
        file_path_1=DIFF_FILE_PATH_1,
        file_path_2=DIFF_FILE_PATH_2,
        able_to_respond_with_error_code=True,
    )


@pytest.mark.parametrize(
    "input_list,args", list(zip(run_cli_inputs(), run_expected_args()))
)
def test_run_arg_parse(input_list, args):
    assert GCodeCLI.parse_args(input_list) == args


@pytest.mark.parametrize(
    "input_list,command", list(zip(run_cli_inputs(), run_expected_commands()))
)
def test_run_command_vals(input_list, command):
    assert GCodeCLI.to_command(GCodeCLI.parse_args(input_list)) == command


@pytest.mark.parametrize(
    "diff_input_args,args", list(zip(diff_cli_input(), diff_expected_args()))
)
def test_diff_arg_parse(diff_input_args, args):
    assert GCodeCLI.parse_args(diff_input_args) == args


@pytest.mark.parametrize(
    "diff_input_args,command", list(zip(diff_cli_input(), diff_expected_command()))
)
def test_diff_command_vals(diff_input_args, command):
    assert GCodeCLI.to_command(GCodeCLI.parse_args(diff_input_args)) == command


@pytest.mark.parametrize(
    "run_command", run_commands()
)
def test_run_command(run_command):
    # TODO: This assert sucks. Need to figure out how to make it better
    assert len(run_command.execute()) > 0


def test_same_file_content_diff_command(same_file_content_diff_command):
    assert (
        same_file_content_diff_command.execute()
        == "No difference between compared strings"
    )


def test_different_file_content_diff_command(different_file_content_diff_command):
    assert (
        different_file_content_diff_command.execute() == "<span>Hello</span>"
        '<del style="background:#ffe6e6;font-size:large;font-weight:bold;"> World</del>'
    )


def test_unparsable_cli_command_error():
    with pytest.raises(UnparsableCLICommandError):
        GCodeCLI.to_command({"command": "bad"})


def test_cli_configurations_command():
    command = GCodeCLI.to_command({"command": "configurations"})
    assert 'Runnable Configurations' in command.execute()