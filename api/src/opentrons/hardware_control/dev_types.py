from __future__ import annotations
# this file defines types that require dev dependencies
# and are only relevant for static typechecking. this file should only
# be imported if typing.TYPE_CHECKING is True
import asyncio
from typing import List, Optional, Dict, Union

from typing_extensions import Protocol, TypedDict, Literal

from opentrons_shared_data.pipette.dev_types import (
    PipetteModel, PipetteName, ChannelCount
)

from opentrons.drivers.types import MoveSplit
from .modules import ModuleAtPort
from .types import HardwareEventType

from opentrons.types import Mount
from opentrons.config.pipette_config import PipetteConfig


class RegisterModules(Protocol):
    async def __call__(
        self,
        new_mods_at_ports: List[ModuleAtPort] = None,
        removed_mods_at_ports: List[ModuleAtPort] = None
    ) -> None: ...


class HasLoop(Protocol):
    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        ...


DoorStateNotificationType = Literal[HardwareEventType.DOOR_SWITCH_CHANGE]


class InstrumentSpec(TypedDict):
    model: Union[PipetteModel, None]
    id: Optional[str]


class AttachedInstrument(TypedDict):
    config: Optional[PipetteConfig]
    id: Optional[str]


AttachedInstruments = Dict[Mount, AttachedInstrument]


EIGHT_CHANNELS = Literal[8]
ONE_CHANNEL = Literal[1]


class PipetteDict(TypedDict):
    name: PipetteName
    model: PipetteModel
    pipette_id: str
    display_name: str
    min_volume: float
    max_volume: float
    channels: ChannelCount
    aspirate_flow_rate: float
    dispense_flow_rate: float
    blow_out_flow_rate: float
    aspirate_speed: float
    dispense_speed: float
    blow_out_speed: float
    current_volume: float
    tip_length: float
    working_volume: float
    tip_overlap: Dict[str, float]
    available_volume: float
    return_tip_height: float
    default_aspirate_flow_rates: Dict[str, float]
    default_dispense_flow_rates: Dict[str, float]
    default_blow_out_flow_rates: Dict[str,  float]
    default_aspirate_speeds: Dict[str, float]
    default_dispense_speeds: Dict[str, float]
    default_blow_out_speeds: Dict[str, float]
    ready_to_aspirate: bool
    has_tip: bool


class InstrumentHardwareConfigs(TypedDict):
    steps_per_mm: float
    home_pos: float
    max_travel: float
    idle_current: float
    splits: Optional[MoveSplit]
