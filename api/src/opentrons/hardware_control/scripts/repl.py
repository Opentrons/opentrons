"""opentrons.hardware_control.scripts.repl - cli for hc api

Running this script will create and spin up a hardware controller
and expose it to a python commandline.
"""

import os
from functools import wraps
import asyncio
import logging
from logging.config import dictConfig
from opentrons.hardware_control.api import API
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import HardwareFeatureFlags

update_firmware = True
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
    if os.environ.get("OT3_DISABLE_FW_UPDATES"):
        update_firmware = False
        print("OT3 firmware updates are disabled")

from code import interact  # noqa: E402
from subprocess import run  # noqa: E402
from typing import Union, Type, Any  # noqa: E402

from opentrons.types import Mount, Point  # noqa: E402
from opentrons.config import feature_flags as ff  # noqa: E402
from opentrons.hardware_control.modules.types import ModuleType  # noqa: E402
from opentrons.hardware_control.types import (  # noqa: E402
    Axis,
    OT3Mount,
    SubSystem,
    GripperProbe,
    CriticalPoint,
)
from opentrons.hardware_control.ot3_calibration import (  # noqa: E402
    calibrate_pipette,
    calibrate_belts,
    delete_belt_calibration_data,
    calibrate_gripper_jaw,
    calibrate_module,
    find_calibration_structure_height,
    find_edge_binary,
    CalibrationMethod,
    find_axis_center,
    gripper_pin_offsets_mean,
)
from opentrons.hardware_control.thread_manager import ThreadManager  # noqa: E402


log = logging.getLogger(__name__)

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "file_handler": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "basic",
            "filename": "/var/log/repl.log",
            "maxBytes": 5000000,
            "level": logging.INFO,
            "backupCount": 3,
        },
    },
    "loggers": {
        "": {
            "handlers": ["file_handler"],
            "level": logging.INFO,
        },
    },
}

if ff.enable_ot3_hardware_controller():

    HCApi: Union[Type[OT3API], Type[API]] = OT3API

    def build_thread_manager() -> ThreadManager[Union[API, OT3API]]:
        return ThreadManager(
            OT3API.build_hardware_controller,
            use_usb_bus=ff.rear_panel_integration(),
            update_firmware=update_firmware,
            feature_flags=HardwareFeatureFlags.build_from_ff(),
        )

    def wrap_async_util_fn(fn: Any, *bind_args: Any, **bind_kwargs: Any) -> Any:
        @wraps(fn)
        def synchronizer(*args: Any, **kwargs: Any) -> Any:
            return asyncio.new_event_loop().run_until_complete(
                fn(*bind_args, *args, **bind_kwargs, **kwargs)
            )

        return synchronizer

else:

    HCApi = API

    def build_thread_manager() -> ThreadManager[Union[API, OT3API]]:
        return ThreadManager(
            API.build_hardware_controller,
            feature_flags=HardwareFeatureFlags.build_from_ff(),
        )


logging.basicConfig(level=logging.INFO)


def stop_server() -> None:
    run(["systemctl", "stop", "opentrons-robot-server"])


def build_api() -> ThreadManager[Union[API, OT3API]]:
    # NOTE: We are using StreamHandler so when the hw controller is
    # being built we can log firmware update progress to stdout.
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    logging.getLogger().addHandler(stream_handler)
    tm = build_thread_manager()
    logging.getLogger().removeHandler(stream_handler)
    tm.managed_thread_ready_blocking()

    if update_firmware:

        async def _do_update() -> None:
            async for update in tm.update_firmware():
                print(f"Update: {update.subsystem.name}: {update.progress}%")

        asyncio.run(_do_update())

    return tm


def do_interact(api: ThreadManager[Union[API, OT3API]]) -> None:
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
            "OT3Mount": OT3Mount,
            "SubSystem": SubSystem,
            "GripperProbe": GripperProbe,
            "ModuleType": ModuleType,
            "find_edge": wrap_async_util_fn(find_edge_binary, api),
            "find_calibration_structure_height": wrap_async_util_fn(
                find_calibration_structure_height, api
            ),
            "calibrate_pipette": wrap_async_util_fn(calibrate_pipette, api),
            "calibrate_belts": wrap_async_util_fn(calibrate_belts, api),
            "delete_belt_calibration_data": delete_belt_calibration_data,
            "calibrate_gripper": wrap_async_util_fn(calibrate_gripper_jaw, api),
            "calibrate_module": wrap_async_util_fn(calibrate_module, api),
            "gripper_pin_offsets_mean": gripper_pin_offsets_mean,
            "CalibrationMethod": CalibrationMethod,
            "find_axis_center": wrap_async_util_fn(find_axis_center, api),
            "CriticalPoint": CriticalPoint,
        },
    )


if __name__ == "__main__":
    dictConfig(LOG_CONFIG)
    if has_robot_server:
        stop_server()
    api_tm = build_api()
    do_interact(api_tm)
    api_tm.clean_up()
