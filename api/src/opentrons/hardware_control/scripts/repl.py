"""opentrons.hardware_control.scripts.repl - cli for hc api

Running this script will create and spin up a hardware controller
and expose it to a python commandline.
"""

import os

if not os.environ.get("RUNNING_ON_PI") and not os.environ.get("RUNNING_ON_VERDIN"):
    print("You should run this through the script alias: ot3repl")
    exit()
if os.environ.get("OT2", None):
    print(
        '"OT2" env var detected, running with OT2 HC. '
        "If you dont want this, remove the OT2 env var"
    )
    os.environ["OT_API_FF_enableOT3HardwareController"] = "false"
else:
    print("Running with OT3 HC. If you dont want this, set an " 'env var named "OT2".')
    os.environ["OT_API_FF_enableOT3HardwareController"] = "true"

from code import interact
from subprocess import run
from typing import Union, Type
import logging

from opentrons.types import Mount, Point
from opentrons.hardware_control.types import Axis
from opentrons.config.feature_flags import enable_ot3_hardware_controller

if enable_ot3_hardware_controller():
    from opentrons.hardware_control.ot3api import OT3API

    HCApi: Union[Type[OT3API], Type["API"]] = OT3API
else:
    from opentrons.hardware_control.api import API

    HCApi = API

from opentrons.hardware_control.protocols import HardwareControlAPI
from opentrons.hardware_control.thread_manager import ThreadManager

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
        local={"api": api.sync, "Mount": Mount, "Point": Point, "Axis": Axis},
    )


if __name__ == "__main__":
    stop_server()
    api_tm = build_api()
    api_tm.sync.cache_instruments()
    do_interact(api_tm)
    api_tm.clean_up()
