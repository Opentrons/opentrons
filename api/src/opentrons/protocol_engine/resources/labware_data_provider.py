"""Labware data resource provider."""
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_api.labware import get_labware_definition


class LabwareDataProvider:
    """Labware data provider."""

    # NOTE(mc, 2020-10-18): async to allow file reading and parsing to be
    # async on a worker thread in the future
    @staticmethod
    async def get_labware_definition(
        load_name: str,
        namespace: str,
        version: int,
    ) -> LabwareDefinition:
        """Get a labware definition given the labware's identification."""
        return LabwareDefinition.parse_obj(
            get_labware_definition(load_name, namespace, version)
        )
