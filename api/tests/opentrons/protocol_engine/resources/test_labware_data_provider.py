"""Functional tests for the LabwareData provider."""
from typing import cast

from mock import patch

from opentrons_shared_data.labware import dev_types

from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName, Point
from opentrons.protocol_api.labware import get_labware_definition
from opentrons.calibration_storage.helpers import hash_labware_def

from opentrons.protocol_engine.types import DeckSlotLocation
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


async def test_labware_data_gets_calibration(
    well_plate_def: LabwareDefinition,
) -> None:
    """It should be able to get a labware's calibration data."""
    # TODO(mc, 2020-10-18): this mock is a kinda code-smelly. Fetching labware
    #  calibration data is a little convoluted and could use some clean up
    with patch(
        "opentrons.protocol_engine.resources.labware_data_provider.get_labware_calibration"  # noqa: E501
    ) as mock_get_lw_calibration:
        mock_get_lw_calibration.return_value = Point(1, 2, 3)

        result = await LabwareDataProvider().get_labware_calibration(
            well_plate_def,
            DeckSlotLocation(slot=DeckSlotName.SLOT_5),
        )

        as_type_dict = cast(dev_types.LabwareDefinition, well_plate_def.dict())

        assert result == (1, 2, 3)
        mock_get_lw_calibration.assert_called_with(
            f"{hash_labware_def(as_type_dict)}.json",
            as_type_dict,
            parent="",
        )
