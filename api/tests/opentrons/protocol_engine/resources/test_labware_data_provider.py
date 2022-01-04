"""Functional tests for the LabwareData provider."""
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_api.labware import get_labware_definition

from opentrons.protocol_engine.resources import LabwareDataProvider


async def test_labware_data_gets_standard_definition() -> None:
    """It should be able to get a "standard" labware's definition."""
    expected = get_labware_definition(
        load_name="opentrons_96_tiprack_300ul",
        namespace="opentrons",
        version=1,
    )
    result = await LabwareDataProvider().get_labware_definition(
        load_name="opentrons_96_tiprack_300ul",
        namespace="opentrons",
        version=1,
    )

    assert result == LabwareDefinition.parse_obj(expected)
