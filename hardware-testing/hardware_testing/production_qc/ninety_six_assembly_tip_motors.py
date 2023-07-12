"""96ch Tip-Motors Assembly."""
import asyncio

from hardware_testing.opentrons_api.types import OT3Axis
from hardware_testing.opentrons_api import helpers_ot3


RETRACT_MM = 5


async def _main() -> None:
    print("start")
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=False)
    print("homing Q axis")
    await api.home([OT3Axis.Q])
    print(f"moving {RETRACT_MM} away from endstop")
    await helpers_ot3.move_tip_motor_relative_ot3(api, RETRACT_MM)
    print("homing Q axis")
    await api.home([OT3Axis.Q])
    print("done")


if __name__ == "__main__":
    asyncio.run(_main())
