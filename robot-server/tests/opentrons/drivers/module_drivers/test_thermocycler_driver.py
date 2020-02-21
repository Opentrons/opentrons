# from tests.opentrons.conftest import fuzzy_assert

# Simulating how the firmware will handle commands and respond
# The ACK argument given to 'write_and_return' is what the
# 'serial_communication' module searhces for.
# Once it sees those characters, it then stops reading,
# strips those ACK characters from the response, the return the response
# If you send a commmand to the serial comm module and it never sees the
# expected ACK, then it'll eventually time out and return an error

import types
from opentrons.drivers.thermocycler import Thermocycler


async def test_set_block_temperature():
    # set the block target temperature

    tc = Thermocycler(lambda x: None)
    command_log = []

    tc._target_temp = 25
    tc._current_temp = 25

    async def _mock_write_and_wait(self, command):
        nonlocal command_log
        command_log.append(command)
        return command

    tc._write_and_wait = types.MethodType(_mock_write_and_wait, tc)

    # basic set block temp
    await tc.set_temperature(21)
    assert command_log.pop(0) == 'M104 S21'

    # upper clamp set block temp
    await tc.set_temperature(130)
    assert command_log.pop(0) == 'M104 S99'

    # lower clamp set block temp
    await tc.set_temperature(-30)
    assert command_log.pop(0) == 'M104 S0'

    # hold set block temp
    await tc.set_temperature(21, hold_time=1)
    assert command_log.pop(0) == 'M104 S21 H1'

    # volume set block temp
    await tc.set_temperature(21, volume=75)
    assert command_log.pop(0) == 'M104 S21 V75'

    # hold and volume set block temp
    await tc.set_temperature(21, hold_time=1, volume=75)
    assert command_log.pop(0) == 'M104 S21 H1 V75'

    # ramp rate set block temp
    await tc.set_temperature(21, ramp_rate=3)
    assert command_log.pop(0) == 'M566 S3'
    assert command_log.pop(0) == 'M104 S21'


async def test_deactivates():
    tc = Thermocycler(lambda x: None)
    command_log = []

    tc._target_temp = 25
    tc._current_temp = 25

    async def _mock_write_and_wait(self, command):
        nonlocal command_log
        command_log.append(command)
        return command

    tc._write_and_wait = types.MethodType(_mock_write_and_wait, tc)

    await tc.deactivate_all()
    assert command_log.pop(0) == 'M18'
    await tc.deactivate_lid()
    assert command_log.pop(0) == 'M108'
    await tc.deactivate_block()
    assert command_log.pop(0) == 'M14'
