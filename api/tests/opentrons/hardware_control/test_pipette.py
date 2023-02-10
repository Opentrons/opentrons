import pytest
from mock import patch
from typing import Union, Callable, Optional, cast, Tuple, overload
from typing_extensions import Protocol
from opentrons.calibration_storage import types as cal_types
from opentrons.types import Point, Mount
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from opentrons.hardware_control.instruments.ot2 import (
    pipette as ot2_pipette,
    instrument_calibration,
)
from opentrons.hardware_control.instruments.ot3 import (
    pipette as ot3_pipette,
    instrument_calibration as ot3_calibration,
)
from opentrons.hardware_control import types
from opentrons.config import pipette_config, ot3_pipette_config
from opentrons_shared_data.pipette.dev_types import PipetteModel

OT2_PIP_CAL = instrument_calibration.PipetteOffsetByPipetteMount(
    offset=Point(0, 0, 0),
    source=cal_types.SourceType.user,
    status=cal_types.CalibrationStatus(),
)

OT3_PIP_CAL = ot3_calibration.PipetteOffsetByPipetteMount(
    offset=Point(0, 0, 0),
    source=cal_types.SourceType.user,
    status=cal_types.CalibrationStatus(),
)


class OT2PipetteCreator(Protocol):
    def __call__(
        self,
        model: PipetteModel,
        calibration: Optional[
            instrument_calibration.PipetteOffsetByPipetteMount
        ] = None,
        id: Optional[str] = None,
    ) -> ot2_pipette.Pipette:
        ...


class OT3PipetteCreator(Protocol):
    def __call__(
        self,
        model: ot3_pipette_config.PipetteModelVersionType,
        calibration: Optional[ot3_calibration.PipetteOffsetByPipetteMount] = None,
        id: Optional[str] = None,
    ) -> ot3_pipette.Pipette:
        ...


@pytest.fixture
def hardware_pipette_ot2() -> OT2PipetteCreator:
    def _create_pipette(
        model: PipetteModel,
        calibration: Optional[
            instrument_calibration.PipetteOffsetByPipetteMount
        ] = None,
        id: Optional[str] = None,
    ) -> ot2_pipette.Pipette:

        return ot2_pipette.Pipette(
            pipette_config.load(model), calibration or OT2_PIP_CAL, id or "testID"
        )

    return _create_pipette


@pytest.fixture
def hardware_pipette_ot3() -> OT3PipetteCreator:
    def _create_pipette(
        model: ot3_pipette_config.PipetteModelVersionType,
        calibration: Optional[ot3_calibration.PipetteOffsetByPipetteMount] = None,
        id: Optional[str] = None,
    ) -> ot3_pipette.Pipette:
        return ot3_pipette.Pipette(
            ot3_pipette_config.load_ot3_pipette(model),
            calibration or OT3_PIP_CAL,
            id or "testID",
        )

    return _create_pipette


EitherBuilderAndModel = Union[
    Tuple[OT2PipetteCreator, PipetteModel],
    Tuple[OT3PipetteCreator, ot3_pipette_config.PipetteModelVersionType],
]

EitherBuilderModelAndCalibration = Union[
    Tuple[
        OT2PipetteCreator,
        PipetteModel,
        instrument_calibration.PipetteOffsetByPipetteMount,
    ],
    Tuple[
        OT3PipetteCreator,
        ot3_pipette_config.PipetteModelVersionType,
        ot3_calibration.PipetteOffsetByPipetteMount,
    ],
]


@overload
def build_pipette(
    builder_and_model: Tuple[OT2PipetteCreator, PipetteModel]
) -> ot2_pipette.Pipette:
    ...


@overload
def build_pipette(
    builder_and_model: Tuple[
        OT3PipetteCreator, ot3_pipette_config.PipetteModelVersionType
    ]
) -> ot3_pipette.Pipette:
    ...


@overload
def build_pipette(
    builder_and_model: Tuple[
        OT2PipetteCreator,
        PipetteModel,
        instrument_calibration.PipetteOffsetByPipetteMount,
    ]
) -> ot2_pipette.Pipette:
    ...


@overload
def build_pipette(
    builder_and_model: Tuple[
        OT3PipetteCreator,
        ot3_pipette_config.PipetteModelVersionType,
        ot3_calibration.PipetteOffsetByPipetteMount,
    ]
) -> ot3_pipette.Pipette:
    ...


def build_pipette(
    builder_and_model: Union[EitherBuilderAndModel, EitherBuilderModelAndCalibration]
) -> Union[ot2_pipette.Pipette, ot3_pipette.Pipette]:
    return builder_and_model[0](*builder_and_model[1:])


@pytest.mark.parametrize(
    argnames=["builder_and_model"],
    argvalues=[
        [(lazy_fixture("hardware_pipette_ot2"), "p10_single_v1")],
        [
            (
                lazy_fixture("hardware_pipette_ot3"),
                ot3_pipette_config.convert_pipette_model(
                    cast(PipetteModel, "p1000_single_v1.0")
                ),
            ),
        ],
    ],
)
def test_tip_tracking(builder_and_model: EitherBuilderAndModel) -> None:
    hw_pipette = build_pipette(builder_and_model)
    with pytest.raises(AssertionError):
        hw_pipette.remove_tip()
    assert not hw_pipette.has_tip
    tip_length = 25.0
    hw_pipette.add_tip(tip_length)
    assert hw_pipette.has_tip
    with pytest.raises(AssertionError):
        hw_pipette.add_tip(tip_length)
    hw_pipette.remove_tip()
    assert not hw_pipette.has_tip
    with pytest.raises(AssertionError):
        hw_pipette.remove_tip()


@pytest.mark.parametrize(
    argnames=["pipette_builder_and_model", "nozzle_offset"],
    argvalues=[
        [(lazy_fixture("hardware_pipette_ot2"), "p10_single_v1"), Point(0, 0, 12.0)],
        [
            (
                lazy_fixture("hardware_pipette_ot3"),
                ot3_pipette_config.convert_pipette_model(
                    cast(PipetteModel, "p1000_single_v1.0")
                ),
            ),
            Point(-8.0, -22.0, -259.15),
        ],
    ],
)
def test_tip_nozzle_position_tracking(
    pipette_builder_and_model: EitherBuilderAndModel,
    nozzle_offset: Point,
) -> None:
    hw_pipette = build_pipette(pipette_builder_and_model)
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


@pytest.mark.parametrize(
    argnames=["bmc"],
    argvalues=[
        [
            (
                lazy_fixture("hardware_pipette_ot2"),
                "p10_single_v1",
                instrument_calibration.PipetteOffsetByPipetteMount(
                    offset=Point(10, 10, 10),
                    source=cal_types.SourceType.user,
                    status=cal_types.CalibrationStatus(),
                ),
            ),
        ],
        [
            (
                lazy_fixture("hardware_pipette_ot3"),
                ot3_pipette_config.convert_pipette_model(
                    cast(PipetteModel, "p1000_single_v1.0")
                ),
                ot3_calibration.PipetteOffsetByPipetteMount(
                    offset=Point(10, 10, 10),
                    source=cal_types.SourceType.user,
                    status=cal_types.CalibrationStatus(),
                ),
            ),
        ],
    ],
)
def test_critical_points_pipette_offset(bmc: EitherBuilderModelAndCalibration) -> None:
    hw_pipette = build_pipette(bmc)
    _, _, calibration = bmc
    # pipette offset + nozzle offset to determine critical point
    offsets = calibration.offset + Point(*hw_pipette.nozzle_offset)
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


@pytest.mark.parametrize(
    argnames=["builder_and_model", "max_volume"],
    argvalues=[
        [(lazy_fixture("hardware_pipette_ot2"), "p10_single_v1"), 10.0],
        [
            (
                lazy_fixture("hardware_pipette_ot3"),
                ot3_pipette_config.convert_pipette_model(
                    cast(PipetteModel, "p1000_single_v1.0")
                ),
            ),
            1000.0,
        ],
    ],
)
def test_volume_tracking(
    builder_and_model: EitherBuilderAndModel,
    max_volume: float,
) -> None:
    hw_pipette = build_pipette(builder_and_model)
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


@pytest.mark.ot2_only
def test_config_update(hardware_pipette_ot2: OT2PipetteCreator) -> None:
    hw_pipette = hardware_pipette_ot2(cast(PipetteModel, "p10_single_v1"))
    sample_plunger_pos = {"top": 19.5}
    hw_pipette.update_config_item("top", sample_plunger_pos.get("top"))
    assert hw_pipette.config.top == sample_plunger_pos.get("top")


@pytest.mark.ot2_only
def test_flow_rate_setting(
    hardware_pipette_ot2: OT2PipetteCreator,
) -> None:
    hw_pipette = hardware_pipette_ot2(cast(PipetteModel, "p10_single_v1"))
    # pipettes should load settings from config at init time
    assert (
        hw_pipette.aspirate_flow_rate
        == hw_pipette.config.default_aspirate_flow_rates["2.0"]
    )
    assert (
        hw_pipette.dispense_flow_rate
        == hw_pipette.config.default_dispense_flow_rates["2.0"]
    )
    assert (
        hw_pipette.blow_out_flow_rate
        == hw_pipette.config.default_blow_out_flow_rates["2.0"]
    )
    # changing flow rates with normal property access shouldn't touch
    # config or other flow rates
    hw_pipette.aspirate_flow_rate = 2
    assert hw_pipette.aspirate_flow_rate == 2
    assert (
        hw_pipette.dispense_flow_rate
        == hw_pipette.config.default_dispense_flow_rates["2.0"]
    )
    assert (
        hw_pipette.blow_out_flow_rate
        == hw_pipette.config.default_blow_out_flow_rates["2.0"]
    )
    hw_pipette.dispense_flow_rate = 3
    assert hw_pipette.aspirate_flow_rate == 2
    assert hw_pipette.dispense_flow_rate == 3
    assert (
        hw_pipette.blow_out_flow_rate
        == hw_pipette.config.default_blow_out_flow_rates["2.0"]
    )
    hw_pipette.blow_out_flow_rate = 4
    assert hw_pipette.aspirate_flow_rate == 2
    assert hw_pipette.dispense_flow_rate == 3
    assert hw_pipette.blow_out_flow_rate == 4


@pytest.mark.parametrize(
    argnames=[
        "builder_and_model",
        "expected_xy_critical_point",
        "expected_front_critical_point",
    ],
    argvalues=[
        [
            (lazy_fixture("hardware_pipette_ot2"), "p10_single_v1"),
            Point(0, 0, 12.0),
            Point(0, 0, 12.0),
        ],
        [
            (lazy_fixture("hardware_pipette_ot2"), "p300_multi_v2.0"),
            Point(0.0, 0.0, 35.52),
            Point(0.0, -31.5, 35.52),
        ],
        [
            (
                lazy_fixture("hardware_pipette_ot3"),
                ot3_pipette_config.convert_pipette_model(
                    cast(PipetteModel, "p1000_single_v1.0")
                ),
            ),
            Point(-8.0, -22.0, -259.15),
            Point(-8.0, -22.0, -259.15),
        ],
        [
            (
                lazy_fixture("hardware_pipette_ot3"),
                ot3_pipette_config.convert_pipette_model(
                    cast(PipetteModel, "p1000_multi_v1.0")
                ),
            ),
            Point(-8.0, -47.5, -259.15),
            Point(-8.0, -79.0, -259.15),
        ],
        [
            (
                lazy_fixture("hardware_pipette_ot3"),
                ot3_pipette_config.convert_pipette_model(
                    cast(PipetteModel, "p1000_96"), "1.0"
                ),
            ),
            Point(13.5, -46.5, -259.15),
            Point(-36.0, -88.5, -259.15),
        ],
    ],
)
def test_alternative_critical_points(
    builder_and_model: EitherBuilderAndModel,
    model: Union[str, ot3_pipette_config.PipetteModelVersionType],
    expected_xy_critical_point: Point,
    expected_front_critical_point: Point,
) -> None:
    hw_pipette = build_pipette(builder_and_model)
    assert (
        hw_pipette.critical_point(types.CriticalPoint.XY_CENTER)
        == expected_xy_critical_point
    )
    assert (
        hw_pipette.critical_point(types.CriticalPoint.FRONT_NOZZLE)
        == expected_front_critical_point
    )


EitherBuilderModelCalibrationAndMount = Union[
    Tuple[
        OT2PipetteCreator,
        PipetteModel,
        instrument_calibration.PipetteOffsetByPipetteMount,
        Mount,
    ],
    Tuple[
        OT3PipetteCreator,
        ot3_pipette_config.PipetteModelVersionType,
        ot3_calibration.PipetteOffsetByPipetteMount,
        types.OT3Mount,
    ],
]


@pytest.mark.parametrize(
    argnames=["bmcm"],
    argvalues=[
        [
            (
                lazy_fixture("hardware_pipette_ot2"),
                "p10_single_v1",
                instrument_calibration.PipetteOffsetByPipetteMount(
                    offset=Point(1, 1, 1),
                    source=cal_types.SourceType.user,
                    status=cal_types.CalibrationStatus(),
                ),
                Mount.LEFT,
            ),
        ],
        [
            (
                lazy_fixture("hardware_pipette_ot3"),
                ot3_pipette_config.convert_pipette_model(
                    cast(PipetteModel, "p1000_single_v1.0")
                ),
                ot3_calibration.PipetteOffsetByPipetteMount(
                    offset=Point(1, 1, 1),
                    source=cal_types.SourceType.user,
                    status=cal_types.CalibrationStatus(),
                ),
                types.OT3Mount.LEFT,
            ),
        ],
    ],
)
def test_reset_instrument_offset(bmcm: EitherBuilderModelCalibrationAndMount) -> None:
    hw_pipette = build_pipette(bmcm[:-1])
    assert hw_pipette.pipette_offset.offset == Point(1, 1, 1)
    # this is arg-type-ignore because I can't get mypy to correlate the type of the
    # axis and the pipette because it's not in the same tuple anymore and it won't
    # trace the correlation of the return value of build_pipette through the tuple
    hw_pipette.reset_pipette_offset(bmcm[-1], to_default=True)  # type: ignore[arg-type]
    assert hw_pipette.pipette_offset.offset == Point(0, 0, 0)


def test_save_instrument_offset_ot2(hardware_pipette_ot2: OT2PipetteCreator) -> None:
    # TODO (lc 10-31-2022) These tests would be much cleaner/easier to mock with
    # an InstrumentCalibrationProvider class (like robot calibration provider)
    # which should be done in a follow-up refactor.
    path_to_calibrations = "opentrons.hardware_control.instruments.ot2.pipette"
    hw_pipette = hardware_pipette_ot2(cast(PipetteModel, "p10_single_v1"))

    assert hw_pipette.pipette_offset.offset == Point(0, 0, 0)
    with patch(f"{path_to_calibrations}.load_pipette_offset") as load_cal:
        hw_pipette.save_pipette_offset(Mount.LEFT, Point(1.0, 2.0, 3.0))
        load_cal.assert_called_once_with("testID", Mount.LEFT)


def test_save_instrument_offset_ot3(hardware_pipette_ot3: OT3PipetteCreator) -> None:
    # TODO (lc 10-31-2022) These tests would be much cleaner/easier to mock with
    # an InstrumentCalibrationProvider class (like robot calibration provider)
    # which should be done in a follow-up refactor.
    path_to_calibrations = "opentrons.hardware_control.instruments.ot3.pipette"
    hw_pipette = hardware_pipette_ot3(
        ot3_pipette_config.convert_pipette_model(
            cast(PipetteModel, "p1000_single_v1.0")
        )
    )

    assert hw_pipette.pipette_offset.offset == Point(0, 0, 0)
    with patch(
        f"{path_to_calibrations}.save_pipette_offset_calibration"
    ) as save_cal, patch(f"{path_to_calibrations}.load_pipette_offset") as load_cal:
        hw_pipette.save_pipette_offset(types.OT3Mount.LEFT, Point(1.0, 2.0, 3.0))

        save_cal.assert_called_once_with(
            "testID", types.OT3Mount.LEFT, Point(x=1.0, y=2.0, z=3.0)
        )
        load_cal.assert_called_once_with("testID", types.OT3Mount.LEFT)


def test_reload_instrument_cal_ot3(hardware_pipette_ot3: OT3PipetteCreator) -> None:
    old_pip = hardware_pipette_ot3(
        ot3_pipette_config.convert_pipette_model(
            cast(PipetteModel, "p1000_single_v1.0")
        )
    )
    # if only calibration is changed
    new_cal = ot3_calibration.PipetteOffsetByPipetteMount(
        offset=Point(3, 4, 5),
        source=cal_types.SourceType.user,
        status=cal_types.CalibrationStatus(),
    )
    new_pip, skipped = ot3_pipette._reload_and_check_skip(
        old_pip.config, old_pip, new_cal
    )

    assert skipped
    # it's the same pipette
    assert new_pip == old_pip
    # only pipette offset has been updated
    assert new_pip._pipette_offset == new_cal
