from unittest import mock

from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocols.context.well import WellImplementation
from opentrons.types import Point
from opentrons.protocol_api import InstrumentContext, labware, MAX_SUPPORTED_VERSION
from opentrons.protocols.execution.execute_json_v5 import _move_to_well


def test_move_to_well_with_optional_params():
    pipette_mock = mock.create_autospec(InstrumentContext)
    instruments = {"somePipetteId": pipette_mock}

    well = labware.Well(
        well_implementation=WellImplementation(
            well_geometry=WellGeometry(
                {
                    "shape": "circular",
                    "depth": 40,
                    "totalLiquidVolume": 100,
                    "diameter": 30,
                    "x": 40,
                    "y": 50,
                    "z": 3,
                },
                parent_point=Point(10, 20, 30),
                parent_object=1,
            ),
            has_tip=False,
            display_name="some well",
            name="A2",
        ),
        api_level=MAX_SUPPORTED_VERSION,
    )

    mock_get_well = mock.MagicMock(return_value=well, name="mock_get_well")

    params = {
        "pipette": "somePipetteId",
        "labware": "someLabwareId",
        "well": "someWell",
        "offset": {"x": 10, "y": 11, "z": 12},
        "forceDirect": mock.sentinel.force_direct,
        "minimumZHeight": mock.sentinel.minimum_z_height,
    }

    with mock.patch(
        "opentrons.protocols.execution.execute_json_v5._get_well", new=mock_get_well
    ):
        _move_to_well(instruments, mock.sentinel.loaded_labware, params)

    assert pipette_mock.mock_calls == [
        mock.call.move_to(
            well.bottom().move(Point(10, 11, 12)),
            force_direct=mock.sentinel.force_direct,
            minimum_z_height=mock.sentinel.minimum_z_height,
        )
    ]

    assert mock_get_well.mock_calls == [mock.call(mock.sentinel.loaded_labware, params)]


def test_move_to_well_without_optional_params():
    pipette_mock = mock.create_autospec(InstrumentContext)
    instruments = {"somePipetteId": pipette_mock}

    well = labware.Well(
        well_implementation=WellImplementation(
            well_geometry=WellGeometry(
                {
                    "shape": "circular",
                    "depth": 40,
                    "totalLiquidVolume": 100,
                    "diameter": 30,
                    "x": 40,
                    "y": 50,
                    "z": 3,
                },
                parent_point=Point(10, 20, 30),
                parent_object=1,
            ),
            has_tip=False,
            display_name="some well",
            name="A2",
        ),
        api_level=MAX_SUPPORTED_VERSION,
    )

    mock_get_well = mock.MagicMock(return_value=well, name="mock_get_well")

    params = {
        "pipette": "somePipetteId",
        "labware": "someLabwareId",
        "well": "someWell",
    }

    with mock.patch(
        "opentrons.protocols.execution.execute_json_v5._get_well", new=mock_get_well
    ):
        _move_to_well(instruments, mock.sentinel.loaded_labware, params)

    assert pipette_mock.mock_calls == [
        mock.call.move_to(well.bottom(), force_direct=False, minimum_z_height=None)
    ]

    assert mock_get_well.mock_calls == [mock.call(mock.sentinel.loaded_labware, params)]
