import pytest
from opentrons import commands


@pytest.mark.parametrize(
    argnames="seconds,"
             "minutes,"
             "expected_seconds,"
             "expected_minutes,"
             "expected_text",
    argvalues=[
        [10, 0, 10, 0, "Delaying for 0 minutes and 10 seconds"],
        [10, 9, 10, 9, "Delaying for 9 minutes and 10 seconds"],
        [100, 0, 40, 1, "Delaying for 1 minutes and 40 seconds"],
        [105, 5.25, 0, 7, "Delaying for 7 minutes and 0 seconds"],
    ]
)
def test_delay(seconds,
               minutes,
               expected_seconds,
               expected_minutes,
               expected_text
               ):
    command = commands.delay(seconds, minutes)
    name = command['name']
    payload = command['payload']

    assert name == 'command.DELAY'
    assert payload['seconds'] == expected_seconds
    assert payload['minutes'] == expected_minutes
    assert payload['text'] == expected_text
