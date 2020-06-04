# this file defines types that require dev dependencies
# and are only relevant for static typechecking. this file should only
# be imported if typing.TYPE_CHECKING is True
import asyncio
from typing import List, Optional

from opentrons_shared_data.pipette.dev_types import (
    PipetteModel
)

from .modules import ModuleAtPort
from .types import HardwareEventType
from typing_extensions import Protocol, TypedDict, Literal


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


class AttachedInstrument(TypedDict):
    model: Optional[PipetteModel]
    id: Optional[str]
