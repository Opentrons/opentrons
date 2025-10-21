"""Test utility functions."""

import typing
import pytest
from performance_metrics._util import format_command


@pytest.mark.parametrize(
    "cmd_list, expected",
    [
        (["python", "my_script.py"], "python my_script.py"),
        (["bash", "another_script.sh"], "bash another_script.sh"),
        (["python", "yet_another_script.py"], "python yet_another_script.py"),
        (["java", "my_java_app.jar"], "java my_java_app.jar"),
        (["some-command", '"foo bar"', "baz"], 'some-command "foo bar" baz'),
        (["some-command", '"foo', ' bar"', "baz"], 'some-command "foo bar" baz'),
        (["some-command", '"foo', 'bar"', "baz"], 'some-command "foo bar" baz'),
    ],
)
def test_format_command(cmd_list: typing.List[str], expected: str) -> None:
    """Test format_command."""
    assert format_command(cmd_list) == expected
