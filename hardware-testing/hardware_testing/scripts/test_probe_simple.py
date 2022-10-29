# Import Python modules
import asyncio

# Import Opentrons API
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, OT3Axis
from opentrons.types import Point

center_position = Point(x=225, y=150, z=100)

async def main() -> None:
    api = await OT3API.build_hardware_controller()
    mount = OT3Mount.LEFT
    await api.home()

    homed_position = await api.gantry_position(mount, refresh=True)
    print("HOMED POSITION = ", homed_position)
    above_point = center_position._replace(z=homed_position.z)
    print("ABOVE POINT = ", above_point)
    await api.move_to(mount, above_point)

    print("UNREFRESHED = ", await api.current_position_ot3(mount))
    print("REFRESHED = ", await api.current_position_ot3(mount, refresh=True))
    print("CURRENT = ", await api.gantry_position(mount))
    await api.move_to(mount, homed_position)

# Main
if __name__ == '__main__':
    asyncio.run(main())
