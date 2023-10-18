"""Common environment data about the robot."""

import os
import sys
import json

from enum import Enum, auto
from typing import Optional
from pathlib import Path

IS_WIN = sys.platform.startswith("win")
IS_OSX = sys.platform == "darwin"
IS_LINUX = sys.platform.startswith("linux")
IS_ROBOT = bool(
    IS_LINUX
    and (os.environ.get("RUNNING_ON_PI") or os.environ.get("RUNNING_ON_VERDIN"))
)
#: This is the correct thing to check to see if we’re running on a robot
IS_VIRTUAL = bool(os.environ.get("ENABLE_VIRTUAL_SMOOTHIE"))


class SystemArchitecture(Enum):
    HOST = auto()
    BUILDROOT = auto()
    YOCTO = auto()


class SystemOS(Enum):
    WIN = auto()
    OSX = auto()
    LINUX = auto()


OS: SystemOS = SystemOS.LINUX
if IS_WIN:
    OS = SystemOS.WIN
elif IS_OSX:
    OS = SystemOS.OSX

ARCHITECTURE: SystemArchitecture = SystemArchitecture.HOST
#: The system architecture running

OT_SYSTEM_VERSION = "0.0.0"
#: The semver string of the system

if IS_ROBOT:
    if "OT_SYSTEM_VERSION" in os.environ:
        OT_SYSTEM_VERSION = os.environ["OT_SYSTEM_VERSION"]
        ARCHITECTURE = SystemArchitecture.YOCTO
    else:
        try:
            with open("/etc/VERSION.json") as vj:
                contents = json.load(vj)
            OT_SYSTEM_VERSION = contents["buildroot_version"]
            ARCHITECTURE = SystemArchitecture.BUILDROOT
        except Exception:
            pass


__all__ = [
    "OS",
    "SystemOS",
    "IS_ROBOT",
    "ARCHITECTURE",
    "SystemArchitecture",
    "OT_SYSTEM_VERSION",
]
