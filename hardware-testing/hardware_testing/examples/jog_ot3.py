"""Test Jogging."""
import argparse
import asyncio
from typing import Optional

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


async def _exercise_pipette(api: OT3API, mount: types.OT3Mount) -> None:
    while True:
        msg = (
            '"t"=tip pickup/drop, "a"=aspirate, '
            '"d"=dispense, "b"=blow-out, "j"=jog: '
        )
        _inp = input(msg).strip()
        try:
            _value = float(_inp[1:])
        except ValueError:
            _value = None  # type: ignore[assignment]
        if _inp[0] == "a":
            try:
                await api.prepare_for_aspirate(mount)
            except Exception as e:
                print(e)
            await api.aspirate(mount, _value)
        elif _inp[0] == "d":
            await api.dispense(mount, _value)
        elif _inp[0] == "b":
            await api.blow_out(mount, _value)
        elif _inp[0] == "t":
            pipette = api.hardware_pipettes[mount.to_mount()]
            assert pipette is not None
            if pipette.has_tip:
                await api.drop_tip(mount)
            elif _value:
                tip_length = helpers_ot3.get_default_tip_length(int(_value))
                await api.pick_up_tip(mount, tip_length)
        elif _inp[0] == "j":
            return
        else:
            print(f"unexpected input: {_inp} ({_value})")


async def _exercise_gripper(api: OT3API) -> None:
    while True:
        inp = input('"g" to grip, "u" to ungrip, "j" to jog: ').strip()
        if inp[0] == "g":
            try:
                force = float(inp[1:])
                await api.grip(force)
            except ValueError as e:
                print(e)
        elif inp[0] == "u":
            await api.ungrip()
        elif inp[0] == "j":
            return
        else:
            print(f"unexpected input: {inp}")


async def _main(
    is_simulating: bool, mount: types.OT3Mount, speed: Optional[float]
) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    while True:
        await helpers_ot3.jog_mount_ot3(api, mount, speed=speed)
        if mount == types.OT3Mount.GRIPPER:
            await _exercise_gripper(api)
        else:
            await _exercise_pipette(api, mount)


if __name__ == "__main__":
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
        "gripper": types.OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )
    parser.add_argument("--speed", type=float)
    args = parser.parse_args()
    _mount = mount_options[args.mount]
    asyncio.run(_main(args.simulate, _mount, args.speed))
