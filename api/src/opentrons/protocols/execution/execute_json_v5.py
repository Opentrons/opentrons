import logging
from typing import TYPE_CHECKING
from opentrons.types import Point
from opentrons.protocols.execution.types import LoadedLabware, Instruments
from .execute_json_v3 import _get_well
if TYPE_CHECKING:
    from opentrons_shared_data.protocol.dev_types import (
        MoveToWellParams
    )

MODULE_LOG = logging.getLogger(__name__)


def _move_to_well(
        instruments: Instruments,
        loaded_labware: LoadedLabware,
        params: 'MoveToWellParams') -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]

    well = _get_well(loaded_labware, params)

    offset = params.get('offset', {})
    offsetPoint = Point(
        offset.get('x', 0),
        offset.get('y', 0),
        offset.get('z', 0))

    pipette.move_to(
        well.bottom().move(offsetPoint),
        force_direct=params.get('forceDirect'),
        minimum_z_height=params.get('minimumZHeight'))
