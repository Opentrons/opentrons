from datetime import datetime, timezone

from opentrons.protocol_engine.commands import HomeCreate, Home, HomeParams, HomeResult
from opentrons.protocol_engine.commands.parse import parse_command, parse_command_create

from opentrons.protocol_engine.types import MotorAxis

from opentrons.protocol_engine.commands.command import CommandStatus


def test_parse_command() -> None:
    # TODO: Should this test with string datetimes and enums,
    # or real Python datetimes and enums, or both?
    input = {
        "id": "command-id",
        "createdAt": "2020-01-02T03:04:05.678901Z",
        "commandType": "home",
        "key": "command-key",
        "status": "succeeded",
        "params": {"axes": ["x", "y"]},
        "result": {},
    }
    result = parse_command(input)

    assert result == Home(
        id="command-id",
        createdAt=datetime(
            year=2020,
            month=1,
            day=2,
            hour=3,
            minute=4,
            second=5,
            microsecond=678901,
            tzinfo=timezone.utc,
        ),
        key="command-key",
        status=CommandStatus.SUCCEEDED,
        params=HomeParams(
            axes=[MotorAxis.X, MotorAxis.Y],
        ),
        result=HomeResult(),
    )


def test_parse_command_create() -> None:
    input = {
        "commandType": "home",
        "params": {"axes": ["x", "y"]},
    }
    result = parse_command_create(input)

    assert result == HomeCreate(
        params=HomeParams(
            axes=[MotorAxis.X, MotorAxis.Y],
        ),
    )


# TODO: Port to Hypothesis.
