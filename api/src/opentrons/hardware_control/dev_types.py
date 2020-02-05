from typing import List
from .modules import ModuleAtPort
try:
    from typing_extensions import Protocol
except ModuleNotFoundError:
    Protocol = None  # type: ignore

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
