from typing import NamedTuple, TYPE_CHECKING, Union
from opentrons import types

if TYPE_CHECKING:
    from .containers_wrapper import LegacyLabware, LegacyWell  # noqa(F401)


class LegacyLocation(NamedTuple):
    labware: Union['LegacyLabware', 'LegacyWell']
    offset: types.Point
