from unittest import mock

from opentrons_shared_data.protocol.types import MoveToWellParams

from opentrons.protocol_api import MAX_SUPPORTED_VERSION, InstrumentContext, labware
from opentrons.protocol_api.core.legacy.legacy_labware_core import LegacyLabwareCore
from opentrons.protocol_api.core.legacy.legacy_well_core import LegacyWellCore
from opentrons.protocol_api.core.legacy.well_geometry import WellGeometry
from opentrons.protocols.execution.execute_json_v5 import _move_to_well
from opentrons.types import Point


def test_move_to_well_with_optional_params() -> None:
    mock_parent = mock.create_autospec(labware.Labware)
    mock_parent_core = mock.create_autospec(LegacyLabwareCore)
    pipette_mock = mock.create_autospec(InstrumentContext)
    instruments = {"somePipetteId": pipette_mock}

    well = labware.Well(
        parent=mock_parent,
        core=LegacyWellCore(
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
                parent_object=mock_parent_core,
            ),
            display_name="some well",
            has_tip=False,
            name="A2",
        ),
        api_version=MAX_SUPPORTED_VERSION,
    )

    mock_get_well = mock.MagicMock(return_value=well, name="mock_get_well")

    params: "MoveToWellParams" = {
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


def test_move_to_well_without_optional_params() -> None:
    mock_parent = mock.create_autospec(labware.Labware)
    mock_parent_core = mock.create_autospec(LegacyLabwareCore)
    pipette_mock = mock.create_autospec(InstrumentContext)
    instruments = {"somePipetteId": pipette_mock}

    well = labware.Well(
        parent=mock_parent,
        core=LegacyWellCore(
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
                parent_object=mock_parent_core,
            ),
            display_name="some well",
            has_tip=False,
            name="A2",
        ),
        api_version=MAX_SUPPORTED_VERSION,
    )

    mock_get_well = mock.MagicMock(return_value=well, name="mock_get_well")

    params: "MoveToWellParams" = {
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
