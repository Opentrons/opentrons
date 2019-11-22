# from tests.opentrons.conftest import fuzzy_assert

# Simulating how the firmware will handle commands and respond
# The ACK argument given to 'write_and_return' is what the
# 'serial_communication' module searhces for.
# Once it sees those characters, it then stops reading,
# strips those ACK characters from the response, the return the response
# If you send a commmand to the serial comm module and it never sees the
# expected ACK, then it'll eventually time out and return an error

import types
import time
import asyncio
from opentrons.drivers.thermocycler import Thermocycler


async def test_set_block_temperature():
    # set the block target temperature

    tc = Thermocycler(lambda x: None)
    command_log = []
    return_string = 'T:none C:90'

    tc._target_temp = 25
    tc._current_temp = 25

    async def _mock_write_and_wait(self, command):
        nonlocal command_log
        command_log.append(command)
        return command

    tc._write_and_wait = types.MethodType(_mock_write_and_wait, tc)

    await tc.set_temperature(25, volume=80)
    assert command_log.pop() == 'M104 S25 V80'
