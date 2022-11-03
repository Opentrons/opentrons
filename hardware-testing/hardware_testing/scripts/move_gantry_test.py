# Import Python modules
import asyncio

# Import Opentrons API
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, OT3Axis
from opentrons.types import Point

CYCLES = 100
PROBE_LENGTH = 34.5
# CENTER = Point(x=77.5, y=54, z=1)
CENTER = Point(x=239, y=160, z=1)

async def main() -> None:
    api = await OT3API.build_hardware_controller()
    mount = OT3Mount.LEFT
    await api.add_tip(mount, PROBE_LENGTH)
    await api.home()

    for i in range(CYCLES):
        cycle = i + 1
        print(f"\n--> Starting Cycle {cycle}/{CYCLES}")
        await api.home()
        home_position = await api.gantry_position(mount)
        above_point = CENTER._replace(z=home_position.z)
        print("1 = ", await api.gantry_position(mount))
        # input("ENTER")
        await api.move_to(mount, above_point)
        print("2 = ", await api.gantry_position(mount))
        # input("ENTER")
        await api.move_to(mount, CENTER + Point(z=10))
        move_position = await api.gantry_position(mount)
        print("3 = ", await api.gantry_position(mount))
        # input("ENTER")
        await api.move_to(mount, move_position._replace(z=home_position.z))
        print("4 = ", await api.gantry_position(mount))
        # input("ENTER")
        await api.move_to(mount, home_position + Point(x=-5, y=-5, z=0))
        print("5 = ", await api.gantry_position(mount))

# Main
if __name__ == '__main__':
    asyncio.run(main())
