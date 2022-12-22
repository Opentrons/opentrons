"""Robot data."""
from dataclasses import dataclass
from typing import Literal

module_types = Literal[
    "magneticModuleV1",
    "magneticModuleV2",
    "temperatureModuleV1",
    "temperatureModuleV2",
    "thermocyclerModuleV1",
    "heaterShakerModuleV1",
]


@dataclass
class Module:
    """Module types."""

    type: module_types
    id: str
    serial: str


@dataclass
class Dev:
    """Info about the robot brought up with 'make -C robot-server dev'."""

    name: str = "dev"
    display_name: str = "opentrons-dev"
    host: str = "localhost"
    port: str = "31950"
    left_pipette: str = ""
    right_pipette: str = ""
    left_pipette_model: str = ""
    right_pipette_model: str = ""


@dataclass
class EmulatedAlpha:
    """Info about the robot brought up with emulation app-testing/ci-tools/ot2_with_all_modules.yaml."""

    name: str = "emulated_alpha"
    display_name: str = "opentrons-dev"
    host: str = "localhost"
    port: str = "31950"
    left_pipette: str = "p300multi&left"
    right_pipette: str = "p20single&right"
    left_pipette_model: str = "P300 8-Channel GEN2"
    right_pipette_model: str = "P20 Single-Channel GEN2"


@dataclass
class Kansas:
    """A robot in Kansas used for testing."""

    name: str = "kansas"
    display_name: str = "kansas"
    host: str = "192.168.71.89"
    port: str = "31950"
    left_pipette: str = "p300multi&left"
    right_pipette: str = "p20single&right"
    left_pipette_model: str = "P300 8-Channel GEN2"
    right_pipette_model: str = "P20 Single-Channel GEN2"


RobotDataType = Dev | Kansas | EmulatedAlpha
ROBOT_MAPPING: dict[str, RobotDataType] = {
    "dev": Dev(),
    "kansas": Kansas(),
    "emulated_alpha": EmulatedAlpha(),  # expecting more configs in the future.
}
