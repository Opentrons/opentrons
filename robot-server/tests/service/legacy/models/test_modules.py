from robot_server.service.legacy.models import modules


def test_validate_command_no_type_conversion():
    cmd = modules.SerialCommand(
            command_type="a_valid_cmd",
            args=["30"]
        )
    assert type(cmd.args[0]) == str
    assert cmd.args[0] == "30"


def test_validate_command_args_multiple_types():
    cmd = modules.SerialCommand(
            command_type="a_valid_cmd",
            args=[[{"temperature": 30, "hold_time_seconds": 20},
                   {"temperature": 40, "hold_time_seconds": 35}],
                  10,
                  50.5]
        )
    assert type(cmd.args[0]) == list
    assert type(cmd.args[1]) == int
    assert type(cmd.args[2]) == float
