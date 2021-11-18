import pytest
from opentrons.commands import protocol_commands


@pytest.mark.parametrize(
    argnames="seconds,"
    "minutes,"
    "expected_seconds,"
    "expected_minutes,"
    "expected_text",
    argvalues=[
        [10, 0, 10, 0, "Delaying for 0 minutes and 10.0 seconds"],
        [10, 9, 10, 9, "Delaying for 9 minutes and 10.0 seconds"],
        [100, 0, 40, 1, "Delaying for 1 minutes and 40.0 seconds"],
        [105, 5.25, 0, 7, "Delaying for 7 minutes and 0.0 seconds"],
        [0.5, 0, 0.5, 0, "Delaying for 0 minutes and 0.5 seconds"],
        [105.5, 5.25, 0.5, 7, "Delaying for 7 minutes and 0.5 seconds"],
        [0.998, 0, 0.998, 0, "Delaying for 0 minutes and 0.998 seconds"],
        [0.9998, 0, 0.9998, 0, "Delaying for 0 minutes and 1.0 seconds"],
        [1.0001, 0, 1.0001, 0, "Delaying for 0 minutes and 1.0 seconds"],
    ],
)
def test_delay(
    seconds: int,
    minutes: int,
    expected_seconds: int,
    expected_minutes: int,
    expected_text: str,
) -> None:
    command = protocol_commands.delay(seconds, minutes)
    name = command["name"]
    payload = command["payload"]

    assert name == "command.DELAY"
    assert payload["seconds"] == expected_seconds
    assert payload["minutes"] == expected_minutes
    assert payload["text"] == expected_text


def test_delay_with_message() -> None:
    """It should allow a message to be appended to the delay text."""
    command = protocol_commands.delay(seconds=1, minutes=1, msg="Waiting...")

    assert command["payload"]["text"] == (
        "Delaying for 1 minutes and 1.0 seconds. Waiting..."
    )
