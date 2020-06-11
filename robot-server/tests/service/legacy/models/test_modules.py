import pytest
from robot_server.service.legacy.models import modules


def test_validate_command_invalid_arg_type():
    with pytest.raises(ValueError,
                       match="3 validation errors for SerialCommand\nargs ->"):
        modules.SerialCommand(
            command_type="set_temperature",
            args=["thirty"]
        )


def test_validate_command_arg_type_conversion():
    cmd = modules.SerialCommand(
            command_type="set_temperature",
            args=["30"]
        )
    assert type(cmd.args[0]) == int
    assert cmd.args[0] == 30


def test_validate_command_args_all_valid_types():
    cmd = modules.SerialCommand(
            command_type="a_valid_cmd_type",
            args=[[{"temperature": 30, "hold_time_seconds": 20},
                   {"temperature": 40, "hold_time_seconds": 35}],
                  10,
                  50.5]
        )
    assert type(cmd.args[0]) == list
    assert type(cmd.args[1]) == int
    assert type(cmd.args[2]) == float
