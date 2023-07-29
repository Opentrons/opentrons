"""Robot QC utils."""
from asyncio import sleep

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import OT3Mount
from hardware_testing.data import ui

SECONDS_TO_WAIT_FOR_INSTRUMENT = 15


async def wait_for_instrument_presence(
    api: OT3API, mount: OT3Mount, presence: bool
) -> bool:
    """Wait for instrument presence."""
    is_gripper = mount == OT3Mount.GRIPPER
    instr_str = "gripper" if is_gripper else "pipette"
    verb = "attach" if presence else "remove"
    direction = "to" if presence else "from"
    for countdown in range(SECONDS_TO_WAIT_FOR_INSTRUMENT):
        print(
            f"{verb} a {instr_str} {direction} the {mount.name} mount "
            f"({countdown + 1}/{SECONDS_TO_WAIT_FOR_INSTRUMENT} seconds)"
        )
        if not api.is_simulator:
            await sleep(1)
        await api.cache_instruments()
        if is_gripper:
            found = api.has_gripper()
        else:
            found = api.hardware_pipettes[mount.to_mount()] is not None
        if found == presence:
            print(f"found instrument on {mount.name}\n")
            return True
    ui.print_error(
        f"unable to detect {instr_str} was {verb}d"
        f"{direction} {mount.name} mount "
        f"after {SECONDS_TO_WAIT_FOR_INSTRUMENT} seconds"
    )
    return False
