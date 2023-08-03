"""Robot QC utils."""
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import helpers_ot3
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
    ui.get_user_ready(
        f"{verb} a {instr_str} {direction} the {mount.name} mount"
    )
    await helpers_ot3.reset_api(api)
    await api.cache_instruments()
    if is_gripper:
        found = api.has_gripper()
    else:
        found = api.hardware_pipettes[mount.to_mount()] is not None
    if found == presence:
        print(f"{instr_str} {verb} {direction} {mount.name}\n")
        return True
    else:
        ui.print_error(
            f"unable to detect {instr_str} was {verb}d"
            f"{direction} {mount.name} mount"
        )
        if not api.is_simulator and ui.get_user_answer("try again"):
            return await wait_for_instrument_presence(api, mount, presence)
        return False
