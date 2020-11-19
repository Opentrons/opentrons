"""Labware data resource provider."""
from typing import Tuple
from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons.protocol_api.labware import get_labware_definition
from opentrons.calibration_storage.get import get_labware_calibration
from opentrons.calibration_storage.helpers import hash_labware_def

from ..types import LabwareLocation


class LabwareDataProvider:
    """Labware data provider."""

    # NOTE(mc, 2020-10-18): async to allow file reading and parsing to be
    # async on a worker thread in the future
    async def get_labware_definition(
        self,
        load_name: str,
        namespace: str,
        version: int,
    ) -> LabwareDefinition:
        """Get a labware definition given the labware's identification."""
        return get_labware_definition(load_name, namespace, version)

    # NOTE(mc, 2020-10-18): async to allow file reading and parsing to be
    # async on a worker thread in the future
    async def get_labware_calibration(
        self,
        definition: LabwareDefinition,
        location: LabwareLocation,
    ) -> Tuple[float, float, float]:
        """Get a labware's calibration data given its definition."""
        # TODO(mc, 2020-10-18): Fetching labware calibration data is a little
        # convoluted and could use some clean up
        labware_path = f'{hash_labware_def(definition)}.json'
        cal_point = get_labware_calibration(
            labware_path,
            definition,
            # TODO(mc, 2020-10-18): Support labware on modules
            parent='',
        )

        return (cal_point.x, cal_point.y, cal_point.z)
