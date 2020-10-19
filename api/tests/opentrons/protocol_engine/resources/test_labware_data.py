"""Functional tests for the LabwareData provider."""
from mock import patch
from opentrons.types import Point
from opentrons.protocol_engine.resources import LabwareData
from opentrons.protocol_api.labware import get_labware_definition
from opentrons.calibration_storage.helpers import hash_labware_def


async def test_labware_data_gets_standard_definition():
    """It should be able to get a "standard" labware's definition."""
    expected = get_labware_definition(
        load_name="opentrons_96_tiprack_300ul",
        namespace="opentrons",
        version=1
    )
    result = await LabwareData().get_labware_definition(
        load_name="opentrons_96_tiprack_300ul",
        namespace="opentrons",
        version=1
    )

    assert result == expected


async def test_labware_data_gets_calibration(minimal_labware_def):
    """It should be able to get a labware's calibration data."""
    # TODO(mc, 2020-10-18): this mock is a kinda code-smelly. Fetching labware
    # calibration data is a little convoluted and could use some clean up
    with patch(
        'opentrons.protocol_engine.resources.get_labware_calibration'
    ) as mock_get_lw_calibration:
        mock_get_lw_calibration.return_value = Point(1, 2, 3)

        result = await LabwareData().get_labware_calibration(
            minimal_labware_def,
            5
        )

        assert result == (1, 2, 3)
        mock_get_lw_calibration.assert_called_with(
            f'{hash_labware_def(minimal_labware_def)}.json',
            minimal_labware_def,
            parent='',
        )
