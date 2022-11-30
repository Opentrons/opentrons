"""opentrons.hardware_control.scripts.repl - cli for hc api

Running this script will create and spin up a hardware controller
and expose it to a python commandline.
"""

import os
from functools import partial, wraps
import asyncio

has_robot_server = True
if os.environ.get("OPENTRONS_SIMULATION"):
    print("Running with simulators")
    has_robot_server = False
if os.environ.get("OT2", None):
    print(
        '"OT2" env var detected, running with OT2 HC. '
        "If you dont want this, remove the OT2 env var"
    )
    os.environ["OT_API_FF_enableOT3HardwareController"] = "false"
else:
    print("Running with OT3 HC. If you dont want this, set an env var named 'OT2'")
    os.environ["OT_API_FF_enableOT3HardwareController"] = "true"

from code import interact  # noqa: E402
from subprocess import run  # noqa: E402
from typing import Union, Type, Any  # noqa: E402
import logging  # noqa: E402

from opentrons.types import Mount, Point  # noqa: E402
from opentrons.hardware_control.types import Axis, CriticalPoint  # noqa: E402
from opentrons.config import feature_flags as ff  # noqa: E402
from opentrons.hardware_control.types import (  # noqa: E402
    OT3Axis,
    OT3Mount,
    GripperProbe,
)
from opentrons.hardware_control.ot3_calibration import (  # noqa: E402
    calibrate_pipette,
    calibrate_gripper,
    find_edge,
    find_deck_position,
    CalibrationMethod,
    find_axis_center,
    gripper_pin_offsets_mean,
)
from opentrons.hardware_control.protocols import HardwareControlAPI  # noqa: E402
from opentrons.hardware_control.thread_manager import ThreadManager  # noqa: E402

if ff.enable_ot3_hardware_controller():
    from opentrons.hardware_control.ot3api import OT3API

    HCApi: Union[Type[OT3API], Type["API"]] = OT3API

    def wrap_async_util_fn(fn: Any, *bind_args: Any, **bind_kwargs: Any) -> Any:
        @wraps(fn)
        def synchronizer(*args: Any, **kwargs: Any) -> Any:
            return asyncio.get_event_loop().run_until_complete(
                fn(*bind_args, *args, **bind_kwargs, **kwargs)
            )

        return synchronizer

else:
    from opentrons.hardware_control.api import API

    HCApi = API


logging.basicConfig(level=logging.INFO)


def stop_server() -> None:
    run(["systemctl", "stop", "opentrons-robot-server"])


def build_api() -> ThreadManager[HardwareControlAPI]:
    tm = ThreadManager(HCApi.build_hardware_controller)
    tm.managed_thread_ready_blocking()
    return tm


def do_interact(api: ThreadManager[HardwareControlAPI]) -> None:
    interact(
        banner=(
            "Hardware Control API REPL\nCall methods on api like "
            "api.move_to(Mount.RIGHT, Point(400, 400, 500))"
        ),
        local={
            "api": api.sync,
            "Mount": Mount,
            "Point": Point,
            "Axis": Axis,
            "OT3Axis": OT3Axis,
            "OT3Mount": OT3Mount,
            "GripperProbe": GripperProbe,
            "find_edge": wrap_async_util_fn(find_edge, api),
            "find_deck_position": wrap_async_util_fn(find_deck_position, api),
            "calibrate_pipette": wrap_async_util_fn(calibrate_pipette, api),
            "calibrate_gripper": wrap_async_util_fn(calibrate_gripper, api),
            "gripper_pin_offsets_mean": gripper_pin_offsets_mean,
            "CalibrationMethod": CalibrationMethod,
            "find_axis_center": wrap_async_util_fn(find_axis_center, api),
            "CriticalPoint": CriticalPoint,
        },
    )


if __name__ == "__main__":
    if has_robot_server:
        stop_server()
    api_tm = build_api()
    do_interact(api_tm)
    api_tm.clean_up()
