from typing import Protocol

import pytest
from mock import patch
from pytest_lazy_fixtures import lf as lazy_fixture

from opentrons_shared_data.errors.exceptions import InvalidLiquidClassName
from opentrons_shared_data.pipette import (
    load_data as load_pipette_data,
)
from opentrons_shared_data.pipette import (
    pipette_definition,
)
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
)
from opentrons_shared_data.pipette import (
    types as pip_types,
)
from opentrons_shared_data.pipette.types import PipetteModel

from opentrons.calibration_storage import types as cal_types
from opentrons.hardware_control import types
from opentrons.hardware_control.instruments.ot3 import (
    instrument_calibration as ot3_calibration,
)
from opentrons.hardware_control.instruments.ot3 import (
    pipette as ot3_pipette,
)
from opentrons.types import Point

OT3_PIP_CAL = ot3_calibration.PipetteOffsetByPipetteMount(
    offset=Point(0, 0, 0),
    source=cal_types.SourceType.user,
    status=cal_types.CalibrationStatus(),
)


class PipetteBuilder(Protocol):
    def __call__(
        self,
        model: pipette_definition.PipetteModelVersionType,
        *,
        calibration: ot3_calibration.PipetteOffsetByPipetteMount | None = None,
        id: str | None = None,
    ) -> ot3_pipette.Pipette: ...


@pytest.fixture
def hardware_pipette_ot3() -> PipetteBuilder:
    def _create_pipette(
        model: pipette_definition.PipetteModelVersionType,
        *,
        calibration: ot3_calibration.PipetteOffsetByPipetteMount | None = None,
        id: str | None = None,
    ) -> ot3_pipette.Pipette:
        calibration = calibration or OT3_PIP_CAL
        id = id or "testID"
        return ot3_pipette.Pipette(
            load_pipette_data.load_definition(
                model.pipette_type,
                model.pipette_channels,
                model.pipette_version,
                model.oem_type,
            ),
            calibration,
            id,
        )

    return _create_pipette


def test_tip_tracking(hardware_pipette_ot3: PipetteBuilder) -> None:
    hw_pipette = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v1.0"))
    )
    hw_pipette.remove_tip()
    assert not hw_pipette.has_tip
    tip_length = 25.0
    hw_pipette.add_tip(tip_length)
    assert hw_pipette.has_tip
    with pytest.raises(AssertionError):
        hw_pipette.add_tip(tip_length)
    hw_pipette.remove_tip()
    assert not hw_pipette.has_tip
    hw_pipette.remove_tip()


def test_tip_nozzle_position_tracking(hardware_pipette_ot3: PipetteBuilder) -> None:
    nozzle_offset = Point(-8.0, -22.0, -259.15)
    hw_pipette = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v3.3")),
    )
    # default pipette offset is[0, 0, 0], only nozzle offset would be used
    # to determine critical point
    assert hw_pipette.critical_point() == nozzle_offset
    assert hw_pipette.critical_point(types.CriticalPoint.NOZZLE) == nozzle_offset
    assert hw_pipette.critical_point(types.CriticalPoint.TIP) == nozzle_offset
    tip_length = 25.0
    hw_pipette.add_tip(tip_length)
    new = nozzle_offset._replace(z=nozzle_offset.z - tip_length)
    assert hw_pipette.critical_point() == new
    assert hw_pipette.critical_point(types.CriticalPoint.NOZZLE) == nozzle_offset
    assert hw_pipette.critical_point(types.CriticalPoint.TIP) == new
    hw_pipette.remove_tip()
    assert hw_pipette.critical_point() == nozzle_offset
    assert hw_pipette.critical_point(types.CriticalPoint.NOZZLE) == nozzle_offset
    assert hw_pipette.critical_point(types.CriticalPoint.TIP) == nozzle_offset


def test_critical_points_pipette_offset(hardware_pipette_ot3: PipetteBuilder) -> None:
    calibration = ot3_calibration.PipetteOffsetByPipetteMount(
        offset=Point(10, 10, 10),
        source=cal_types.SourceType.user,
        status=cal_types.CalibrationStatus(),
    )
    hw_pipette = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v1.0")),
        calibration=calibration,
    )
    # pipette offset + nozzle offset to determine critical point
    offsets = calibration.offset + hw_pipette.nozzle_offset
    assert hw_pipette.critical_point() == offsets
    assert hw_pipette.critical_point(types.CriticalPoint.NOZZLE) == offsets
    assert hw_pipette.critical_point(types.CriticalPoint.TIP) == offsets
    tip_length = 25.0
    hw_pipette.add_tip(tip_length)
    new = offsets._replace(z=offsets.z - tip_length)
    assert hw_pipette.critical_point() == new
    assert hw_pipette.critical_point(types.CriticalPoint.NOZZLE) == offsets
    assert hw_pipette.critical_point(types.CriticalPoint.TIP) == new
    hw_pipette.remove_tip()
    assert hw_pipette.critical_point() == offsets
    assert hw_pipette.critical_point(types.CriticalPoint.NOZZLE) == offsets
    assert hw_pipette.critical_point(types.CriticalPoint.TIP) == offsets


def test_volume_tracking(hardware_pipette_ot3: PipetteBuilder) -> None:
    max_volume = 1000.0
    hw_pipette = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v1.0")),
    )
    assert hw_pipette.current_volume == 0.0
    assert hw_pipette.available_volume == max_volume
    assert hw_pipette.ok_to_add_volume(max_volume - 0.1)
    hw_pipette.set_current_volume(0.1)
    with pytest.raises(AssertionError):
        hw_pipette.set_current_volume(max_volume + 0.1)
    with pytest.raises(AssertionError):
        hw_pipette.set_current_volume(-1)
    assert hw_pipette.current_volume == 0.1
    hw_pipette.remove_current_volume(0.1)
    with pytest.raises(AssertionError):
        hw_pipette.remove_current_volume(0.1)
    assert hw_pipette.current_volume == 0.0
    hw_pipette.set_current_volume(max_volume)
    assert not hw_pipette.ok_to_add_volume(0.1)
    with pytest.raises(AssertionError):
        hw_pipette.add_current_volume(0.1)
    assert hw_pipette.current_volume == max_volume


@pytest.mark.parametrize(
    argnames=[
        "pipette_builder",
        "model",
        "expected_xy_critical_point",
        "expected_front_critical_point",
    ],
    argvalues=[
        [
            lazy_fixture("hardware_pipette_ot3"),
            pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v3.3")),
            Point(-8.0, -22.0, -259.15),
            Point(-8.0, -22.0, -259.15),
        ],
        [
            lazy_fixture("hardware_pipette_ot3"),
            pipette_load_name.convert_pipette_model(PipetteModel("p1000_multi_v3.3")),
            Point(-8.0, -47.5, -259.15),
            Point(-8.0, -79.0, -259.15),
        ],
        [
            lazy_fixture("hardware_pipette_ot3"),
            pipette_load_name.convert_pipette_model(
                PipetteModel("p1000_96"), PipetteModel("3.3")
            ),
            Point(13.5, -57.0, -259.15),
            Point(-36.0, -88.5, -259.15),
        ],
    ],
)
def test_alternative_critical_points(
    pipette_builder: PipetteBuilder,
    model: pipette_definition.PipetteModelVersionType,
    expected_xy_critical_point: Point,
    expected_front_critical_point: Point,
) -> None:
    hw_pipette = pipette_builder(model)
    assert (
        hw_pipette.critical_point(types.CriticalPoint.XY_CENTER)
        == expected_xy_critical_point
    )
    assert (
        hw_pipette.critical_point(types.CriticalPoint.FRONT_NOZZLE)
        == expected_front_critical_point
    )


def test_reset_instrument_offset(hardware_pipette_ot3: PipetteBuilder) -> None:
    hw_pipette = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v1.0")),
        calibration=ot3_calibration.PipetteOffsetByPipetteMount(
            offset=Point(1, 1, 1),
            source=cal_types.SourceType.user,
            status=cal_types.CalibrationStatus(),
        ),
    )
    assert hw_pipette.pipette_offset.offset == Point(1, 1, 1)
    hw_pipette.reset_pipette_offset(types.OT3Mount.LEFT, to_default=True)
    assert hw_pipette.pipette_offset.offset == Point(0, 0, 0)


def test_save_instrument_offset_ot3(
    hardware_pipette_ot3: PipetteBuilder,
) -> None:
    # TODO (lc 10-31-2022) These tests would be much cleaner/easier to mock with
    # an InstrumentCalibrationProvider class (like robot calibration provider)
    # which should be done in a follow-up refactor.
    path_to_calibrations = "opentrons.hardware_control.instruments.ot3.pipette"
    hw_pipette = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v1.0"))
    )

    assert hw_pipette.pipette_offset.offset == Point(0, 0, 0)
    with (
        patch(f"{path_to_calibrations}.save_pipette_offset_calibration") as save_cal,
        patch(f"{path_to_calibrations}.load_pipette_offset") as load_cal,
    ):
        hw_pipette.save_pipette_offset(types.OT3Mount.LEFT, Point(1.0, 2.0, 3.0))

        save_cal.assert_called_once_with(
            "testID", types.OT3Mount.LEFT, Point(x=1.0, y=2.0, z=3.0)
        )
        load_cal.assert_called_once_with("testID", types.OT3Mount.LEFT)


def test_reload_instrument_cal_ot3(
    hardware_pipette_ot3: PipetteBuilder,
) -> None:
    old_pip = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v1.0"))
    )
    # if only calibration is changed
    new_cal = ot3_calibration.PipetteOffsetByPipetteMount(
        offset=Point(3, 4, 5),
        source=cal_types.SourceType.user,
        status=cal_types.CalibrationStatus(),
    )
    new_pip, skipped = ot3_pipette._reload_and_check_skip(
        old_pip.config, old_pip, new_cal, use_old_aspiration_functions=False
    )

    assert skipped
    # it's the same pipette
    assert new_pip == old_pip


def test_tip_type_changing(
    hardware_pipette_ot3: PipetteBuilder,
) -> None:
    pip = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v3.3"))
    )
    # at load, we have the max tip settings
    assert pip.working_volume == 1000
    # setting to the same thing works
    pip.set_tip_type_by_volume(1000)
    assert pip.working_volume == 1000
    # setting to other tip types works
    pip.set_tip_type_by_volume(200)
    assert pip.working_volume == 200

    # specifying a tip that doesn't exist raises an error
    with pytest.raises(InvalidLiquidClassName):
        pip.set_tip_type_by_volume(201)


def test_liquid_class_changing(
    hardware_pipette_ot3: PipetteBuilder,
) -> None:
    pip = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p50_multi_v3.3"))
    )
    assert pip._liquid_class_name == pip_types.LiquidClasses.default
    pip.set_liquid_class_by_name("lowVolumeDefault")
    assert (
        pip._liquid_class_name.value == pip_types.LiquidClasses.lowVolumeDefault.value
    )
    with pytest.raises(InvalidLiquidClassName):
        pip.set_liquid_class_by_name("asdase")
