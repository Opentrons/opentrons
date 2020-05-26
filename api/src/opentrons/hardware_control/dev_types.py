import asyncio
from typing import List, Union
from .modules import ModuleAtPort
from .types import DoorState, HardwareEventType
try:
    from typing_extensions import Protocol
except ModuleNotFoundError:
    Protocol = None  # type: ignore
try:
    from typing_extensions import TypedDict, Literal
except ModuleNotFoundError:
    TypedDict = None  # type: ignore
# this file defines types that require dev dependencies
# and are only relevant for static typechecking.
#
#  - code should be written so that this file can fail to import
#  - or the things defined in here can be None at execution time
#  - only types that match the above criteria should be put here
#  - please include this file as close to a leaf as possible


if Protocol is not None:
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


if TypedDict is not None:
    class DoorStateNotification(TypedDict):
        event: Literal[HardwareEventType.DOOR_SWITCH_CHANGE]
        new_state: DoorState

    # new event types get new TypedDict classes (or dataclasses if we want)

    # when we add more event types we add them here
    HardwareEvent = Union[DoorStateNotification]
