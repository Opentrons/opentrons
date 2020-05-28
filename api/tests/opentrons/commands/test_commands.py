from opentrons import commands


def test_delay():
    command = commands.delay(10, 0)
    assert command['name'] == 'command.DELAY'
    assert command['payload']['seconds'] == 10
    assert command['payload']['minutes'] == 0
    assert command['payload']['text'] == "Delaying for 0 minutes"\
        " and 10 seconds"

    command = commands.delay(10, 9)
    assert command['name'] == 'command.DELAY'
    assert command['payload']['seconds'] == 10
    assert command['payload']['minutes'] == 9
    assert command['payload']['text'] == "Delaying for 9 minutes"\
        " and 10 seconds"

    command = commands.delay(100, 0)
    assert command['name'] == 'command.DELAY'
    assert command['payload']['seconds'] == 40
    assert command['payload']['minutes'] == 1
    assert command['payload']['text'] == "Delaying for 1 minutes"\
        " and 40 seconds"

    command = commands.delay(105, 5.25)
    assert command['name'] == 'command.DELAY'
    assert command['payload']['seconds'] == 0
    assert command['payload']['minutes'] == 7
    assert command['payload']['text'] == "Delaying for 7 minutes"\
        " and 0 seconds"
