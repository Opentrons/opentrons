"""Tests for complex commands executor."""

from typing import Literal, Union, cast

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    BlowoutLocation,
    Coordinate,
    LiquidClassSchemaV1,
    PositionReference,
)
from opentrons_shared_data.liquid_classes.types import TipPositionDict

from opentrons.protocol_api import Labware, TrashBin, WasteChute
from opentrons.protocol_api._liquid import LiquidClass
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons.protocol_api.core.engine.instrument import InstrumentCore
from opentrons.protocol_api.core.engine.transfer_components_executor import (
    AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP,
    LiquidAndAirGapPair,
    TipState,
    TransferComponentsExecutor,
    TransferType,
    absolute_point_from_position_reference_and_offset,
)
from opentrons.protocol_api.core.engine.well import WellCore
from opentrons.protocol_api.disposal_locations import DisposalOffset
from opentrons.protocol_api.labware import Well
from opentrons.protocols.advanced_control.transfers import (
    transfer_liquid_utils as tx_utils,
)
from opentrons.protocols.advanced_control.transfers.transfer_liquid_utils import (
    LocationCheckDescriptors,
)
from opentrons.types import Location, Mount, Point


@pytest.fixture
def mock_instrument_core(decoy: Decoy) -> InstrumentCore:
    """Return a mocked out instrument core."""
    return decoy.mock(cls=InstrumentCore)


@pytest.fixture
def sample_transfer_props(
    maximal_liquid_class_def: LiquidClassSchemaV1,
) -> TransferProperties:
    """Return a mocked out liquid class fixture."""
    return LiquidClass.create(maximal_liquid_class_def).get_for(
        pipette="flex_1channel_50", tip_rack="opentrons_flex_96_tiprack_50ul"
    )


@pytest.fixture(autouse=True)
def patch_mock_raise_if_location_inside_liquid(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace raise_if_location_inside_liquid() with a mock."""
    mock = decoy.mock(func=tx_utils.raise_if_location_inside_liquid)
    monkeypatch.setattr(tx_utils, "raise_if_location_inside_liquid", mock)


@pytest.fixture(autouse=True)
def patch_mock_get_blowout_location_for_trash(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace get_blowout_location_for_trash() with a mock."""
    mock = decoy.mock(func=tx_utils.get_blowout_location_for_trash)
    monkeypatch.setattr(tx_utils, "get_blowout_location_for_trash", mock)


""" Test aspirate properties:
"submerge": {
  "startPosition": {"positionReference": "well-top", "offset": {"x": 1, "y": 2, "z": 3}},
  "speed": 100,
  "delay": {"enable": true, "params": {"duration": 10.0}}},
"retract": {
  "endPosition": {"positionReference": "well-top", "offset": {"x": 3, "y": 2, "z": 1}},
  "speed": 50,
  "airGapByVolume": [[1.0, 0.1], [49.9, 0.1], [50.0, 0.0]],
  "touchTip": {"enable": true, "params": {"zOffset": -1, "mmFromEdge": 0.5, "speed": 30}},
  "delay": {"enable": true, "params": {"duration": 20}}},
"aspiratePosition": {"positionReference": "well-bottom", "offset": {"x": 10, "y": 20, "z": 30}},
"flowRateByVolume": [[1.0, 35.0], [10.0, 24.0], [50.0, 35.0]],
"correctionByVolume": [[0.0, 0.0]],
"preWet": true,
"mix": {"enable": true, "params": {"repetitions": 1, "volume": 50}},
"delay": {"enable": true, "params": {"duration": 0.2}}
"""


@pytest.mark.parametrize(
    argnames=[
        "air_gap_volume",
        "air_gap_flow_rate_by_vol",
    ],
    argvalues=[(0.123, 123), (1.23, 0.123)],
)
def test_submerge(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    air_gap_volume: float,
    air_gap_flow_rate_by_vol: float,
) -> None:
    """Should perform the expected submerge steps."""
    source_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 4)
    well_bottom_point = Point(4, 5, 6)
    air_gap_correction_by_vol = 0.321
    sample_transfer_props.dispense.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.dispense.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(
            ready_to_aspirate=True,
            last_liquid_and_air_gap_in_tip=LiquidAndAirGapPair(
                liquid=0, air_gap=air_gap_volume
            ),
        ),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(source_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(source_well.get_top(0)).then_return(well_top_point)
    decoy.when(source_well.get_top(2)).then_return(Point(1, 2, 6))
    subject.submerge(
        submerge_properties=sample_transfer_props.aspirate.submerge,
        post_submerge_action="aspirate",
    )
    decoy.verify(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(x=2, y=4, z=7), labware=None),
            well_core=source_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="submerge start",
                pipetting_action="aspirate",
            ),
            logger=matchers.Anything(),
        ),
        mock_instrument_core.move_to(
            location=Location(Point(x=2, y=4, z=7), labware=None),
            well_core=source_well,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.remove_air_gap_during_transfer_with_liquid_class(
            last_air_gap=air_gap_volume,
            dispense_props=sample_transfer_props.dispense,
            location=Location(Point(x=2, y=4, z=7), labware=None),
        ),
        mock_instrument_core.move_to(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=100,
        ),
        mock_instrument_core.delay(10),
    )


def test_submerge_without_starting_air_gap(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """Should perform the expected submerge steps."""
    source_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 4)
    well_bottom_point = Point(4, 5, 6)
    air_gap_volume = 0
    sample_transfer_props.dispense.flow_rate_by_volume.set_for_volume(
        air_gap_volume, 1234
    )
    sample_transfer_props.dispense.correction_by_volume.set_for_volume(
        air_gap_volume, 1234
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(
            ready_to_aspirate=True,
            last_liquid_and_air_gap_in_tip=LiquidAndAirGapPair(
                liquid=0, air_gap=air_gap_volume
            ),
        ),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(source_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(source_well.get_top(0)).then_return(well_top_point)
    decoy.when(source_well.get_top(2)).then_return(Point(1, 2, 6))
    subject.submerge(
        submerge_properties=sample_transfer_props.aspirate.submerge,
        post_submerge_action="aspirate",
    )
    decoy.verify(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(x=2, y=4, z=7), labware=None),
            well_core=source_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="submerge start",
                pipetting_action="aspirate",
            ),
            logger=matchers.Anything(),
        ),
        mock_instrument_core.move_to(
            location=Location(Point(x=2, y=4, z=7), labware=None),
            well_core=source_well,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=100,
        ),
        mock_instrument_core.delay(10),
    )


@pytest.mark.parametrize(
    argnames=[
        "air_gap_volume",
        "air_gap_flow_rate_by_vol",
    ],
    argvalues=[(0.123, 123), (1.23, 0.123)],
)
def test_submerge_with_trash_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    air_gap_volume: float,
    air_gap_flow_rate_by_vol: float,
) -> None:
    """Should perform the expected submerge steps."""
    air_gap_correction_by_vol = 0.321
    sample_transfer_props.dispense.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.dispense.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )
    mock_trash_bin = decoy.mock(cls=TrashBin)

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=mock_trash_bin,
        target_well=None,
        tip_state=TipState(
            ready_to_aspirate=True,
            last_liquid_and_air_gap_in_tip=LiquidAndAirGapPair(
                liquid=0, air_gap=air_gap_volume
            ),
        ),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.submerge(
        submerge_properties=sample_transfer_props.dispense.submerge,
        post_submerge_action="dispense",
    )

    decoy.verify(
        mock_instrument_core.move_to(
            location=mock_trash_bin,
            well_core=None,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.remove_air_gap_during_transfer_with_liquid_class(
            last_air_gap=air_gap_volume,
            dispense_props=sample_transfer_props.dispense,
            location=mock_trash_bin,
        ),
        mock_instrument_core.delay(1.1),
    )


def test_submerge_raises_when_submerge_point_is_invalid(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """Should raise an error when submerge start point is invalid."""
    source_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 4)
    well_bottom_point = Point(4, 5, 6)
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(
            ready_to_aspirate=True,
            last_liquid_and_air_gap_in_tip=LiquidAndAirGapPair(liquid=0, air_gap=123),
        ),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(source_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(source_well.get_top(0)).then_return(well_top_point)
    decoy.when(mock_instrument_core.get_liquid_presence_detection()).then_return(False)
    decoy.when(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(x=2, y=4, z=7), labware=None),
            well_core=source_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="submerge start",
                pipetting_action="aspirate",
            ),
            logger=matchers.Anything(),
        )
    ).then_raise(RuntimeError("Oh no!"))
    with pytest.raises(RuntimeError, match="Oh no!"):
        subject.submerge(
            submerge_properties=sample_transfer_props.aspirate.submerge,
            post_submerge_action="aspirate",
        )


@pytest.mark.parametrize(
    argnames=["position_reference"],
    argvalues=[
        [PositionReference.WELL_BOTTOM],
        [PositionReference.LIQUID_MENISCUS],
    ],
)
def test_aspirate_and_wait(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    position_reference: PositionReference,
) -> None:
    """It should execute an aspirate and a delay according to properties."""
    source_well = decoy.mock(cls=WellCore)
    sample_transfer_props.aspirate.aspirate_position.position_reference = (
        position_reference
    )
    aspirate_flow_rate = (
        sample_transfer_props.aspirate.flow_rate_by_volume.get_for_volume(10)
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(5)
    correction_volume = (
        sample_transfer_props.aspirate.correction_by_volume.get_for_volume(15)
    )
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.aspirate_and_wait(volume=10)
    decoy.verify(
        mock_instrument_core.aspirate(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=None,
            volume=10,
            rate=1,
            flow_rate=aspirate_flow_rate,
            in_place=True,
            correction_volume=correction_volume,
        ),
        mock_instrument_core.delay(0.2),
    )


def test_aspirate_and_wait_skips_delay(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should skip the wait after aspirate."""
    sample_transfer_props.aspirate.delay.enabled = False
    source_well = decoy.mock(cls=WellCore)
    decoy.when(mock_instrument_core.get_current_volume()).then_return(5)

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.aspirate_and_wait(volume=10)
    decoy.verify(
        mock_instrument_core.delay(0.2),
        times=0,
    )


@pytest.mark.parametrize(
    argnames=["position_reference"],
    argvalues=[
        [PositionReference.WELL_BOTTOM],
        [PositionReference.LIQUID_MENISCUS],
    ],
)
def test_dispense_and_wait(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    position_reference: PositionReference,
) -> None:
    """It should execute a dispense and a delay according to properties."""
    source_well = decoy.mock(cls=WellCore)
    sample_transfer_props.dispense.dispense_position.position_reference = (
        position_reference
    )
    dispense_flow_rate = (
        sample_transfer_props.dispense.flow_rate_by_volume.get_for_volume(10)
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(50)
    correction_volume = (
        sample_transfer_props.dispense.correction_by_volume.get_for_volume(40)
    )
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.dispense_and_wait(
        dispense_properties=sample_transfer_props.dispense,
        volume=10,
        push_out_override=123,
    )
    decoy.verify(
        mock_instrument_core.dispense(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=None,
            volume=10,
            rate=1,
            flow_rate=dispense_flow_rate,
            in_place=True,
            push_out=123,
            correction_volume=correction_volume,
        ),
        mock_instrument_core.delay(0.5),
    )


def test_dispense_and_wait_skips_delay(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should skip the wait after dispense."""
    sample_transfer_props.dispense.delay.enabled = False
    source_well = decoy.mock(cls=WellCore)
    decoy.when(mock_instrument_core.get_current_volume()).then_return(50)

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.dispense_and_wait(
        dispense_properties=sample_transfer_props.dispense,
        volume=10,
        push_out_override=123,
    )
    decoy.verify(
        mock_instrument_core.delay(0.2),
        times=0,
    )


def test_dispense_and_wait_raises_if_tip_volume_less_than_dispense_vol(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """Should raise a useful error if trying to dispense more than liquid present in tip."""
    decoy.when(mock_instrument_core.get_current_volume()).then_return(50)

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=decoy.mock(cls=WellCore),
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    with pytest.raises(
        RuntimeError, match="Cannot dispense 51uL when the tip has only 50uL."
    ):
        subject.dispense_and_wait(
            dispense_properties=sample_transfer_props.dispense,
            volume=51,
            push_out_override=123,
        )


def test_dispense_into_trash_and_wait(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should execute a dispense and a delay according to properties."""
    mock_trash_bin = decoy.mock(cls=TrashBin)
    dispense_flow_rate = (
        sample_transfer_props.dispense.flow_rate_by_volume.get_for_volume(10)
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(50)
    correction_volume = (
        sample_transfer_props.dispense.correction_by_volume.get_for_volume(40)
    )
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=mock_trash_bin,
        target_well=None,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.dispense_and_wait(
        dispense_properties=sample_transfer_props.dispense,
        volume=10,
        push_out_override=123,
    )
    decoy.verify(
        mock_instrument_core.dispense(
            location=mock_trash_bin,
            well_core=None,
            volume=10,
            rate=1,
            flow_rate=dispense_flow_rate,
            in_place=True,
            push_out=123,
            correction_volume=correction_volume,
        ),
        mock_instrument_core.delay(0.5),
    )


def test_mix(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should execute mix steps."""
    source_well = decoy.mock(cls=WellCore)
    aspirate_flow_rate = (
        sample_transfer_props.aspirate.flow_rate_by_volume.get_for_volume(50)
    )
    dispense_flow_rate = (
        sample_transfer_props.dispense.flow_rate_by_volume.get_for_volume(50)
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0, 50)
    aspirate_correction_volume = (
        sample_transfer_props.aspirate.correction_by_volume.get_for_volume(50)
    )
    dispense_correction_volume = (
        sample_transfer_props.dispense.correction_by_volume.get_for_volume(0)
    )
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.mix(
        mix_properties=sample_transfer_props.aspirate.mix,
        last_dispense_push_out=True,
    )

    decoy.verify(
        mock_instrument_core.aspirate(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=None,
            volume=50,
            rate=1,
            flow_rate=aspirate_flow_rate,
            in_place=True,
            correction_volume=aspirate_correction_volume,
        ),
        mock_instrument_core.delay(0.2),
        mock_instrument_core.dispense(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=None,
            volume=50,
            rate=1,
            flow_rate=dispense_flow_rate,
            in_place=True,
            push_out=2.0,
            correction_volume=dispense_correction_volume,
        ),
        mock_instrument_core.delay(0.5),
    )


def test_mix_disabled(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should not perform a mix when it is disabled."""
    sample_transfer_props.aspirate.mix.enabled = False
    source_well = decoy.mock(cls=WellCore)
    aspirate_flow_rate = (
        sample_transfer_props.aspirate.flow_rate_by_volume.get_for_volume(50)
    )
    correction_volume = (
        sample_transfer_props.aspirate.correction_by_volume.get_for_volume(50)
    )
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.mix(
        mix_properties=sample_transfer_props.aspirate.mix,
        last_dispense_push_out=True,
    )
    decoy.verify(
        mock_instrument_core.aspirate(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=None,
            volume=50,
            rate=1,
            flow_rate=aspirate_flow_rate,
            in_place=True,
            correction_volume=correction_volume,
        ),
        times=0,
    )


def test_pre_wet(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should execute pre-wet steps."""
    source_well = decoy.mock(cls=WellCore)
    aspirate_flow_rate = (
        sample_transfer_props.aspirate.flow_rate_by_volume.get_for_volume(40)
    )
    dispense_flow_rate = (
        sample_transfer_props.dispense.flow_rate_by_volume.get_for_volume(40)
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0, 40)
    aspirate_correction_volume = (
        sample_transfer_props.aspirate.correction_by_volume.get_for_volume(40)
    )
    dispense_correction_volume = (
        sample_transfer_props.dispense.correction_by_volume.get_for_volume(0)
    )
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.pre_wet(volume=40)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=None,
            volume=40,
            rate=1,
            flow_rate=aspirate_flow_rate,
            in_place=True,
            correction_volume=aspirate_correction_volume,
        ),
        mock_instrument_core.delay(0.2),
        mock_instrument_core.dispense(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=None,
            volume=40,
            rate=1,
            flow_rate=dispense_flow_rate,
            in_place=True,
            push_out=0,
            correction_volume=dispense_correction_volume,
        ),
        mock_instrument_core.delay(0.5),
    )


def test_pre_wet_disabled(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should NOT execute pre-wet steps."""
    source_well = decoy.mock(cls=WellCore)
    sample_transfer_props.aspirate.pre_wet = False
    aspirate_flow_rate = (
        sample_transfer_props.aspirate.flow_rate_by_volume.get_for_volume(40)
    )
    aspirate_correction_volume = (
        sample_transfer_props.aspirate.correction_by_volume.get_for_volume(50)
    )
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 2, 3), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    subject.pre_wet(volume=40)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=Location(Point(1, 2, 3), labware=None),
            well_core=None,
            volume=40,
            rate=1,
            flow_rate=aspirate_flow_rate,
            in_place=True,
            correction_volume=aspirate_correction_volume,
        ),
        times=0,
    )


@pytest.mark.parametrize(
    argnames=[
        "air_gap_volume",
        "air_gap_flow_rate_by_vol",
        "expected_air_gap_flow_rate",
    ],
    argvalues=[(0.123, 123, 123), (1.23, 0.123, 1.23)],
)
def test_retract_after_aspiration(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    air_gap_volume: float,
    air_gap_flow_rate_by_vol: float,
    expected_air_gap_flow_rate: float,
) -> None:
    """It should execute steps to retract from well after an aspiration."""
    source_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.aspirate.retract.air_gap_by_volume.set_for_volume(
        40, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(source_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(source_well.get_top(0)).then_return(well_top_point)
    decoy.when(source_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 4)
    )  # Retract location is at same height as safe location
    subject.retract_after_aspiration(volume=40)

    decoy.verify(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="retract end",
                pipetting_action="aspirate",
            ),
            logger=matchers.Anything(),
        ),
        mock_instrument_core.move_to(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.delay(20),
        mock_instrument_core.touch_tip(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            radius=1,
            mm_from_edge=0.5,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=expected_air_gap_flow_rate,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
    )


def test_retract_after_aspiration_when_retract_loc_below_safe_airgap_point(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should execute post-aspiration retract steps and air gap above retract location."""
    source_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_correction_by_vol = 0.321
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    expected_air_gap_flow_rate = 123

    sample_transfer_props.aspirate.retract.air_gap_by_volume.set_for_volume(
        40, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(source_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(source_well.get_top(0)).then_return(well_top_point)
    decoy.when(source_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 5)
    )  # Safe location above retract location
    subject.retract_after_aspiration(volume=40)

    decoy.verify(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="retract end",
                pipetting_action="aspirate",
            ),
            logger=matchers.Anything(),
        ),
        mock_instrument_core.move_to(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.delay(20),
        mock_instrument_core.touch_tip(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            radius=1,
            mm_from_edge=0.5,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(x=4, y=4, z=5), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=expected_air_gap_flow_rate,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
    )


def test_post_aspirate_retract_raises_when_retract_point_is_invalid(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """Should raise an error when the retract point is deemed bad."""
    source_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(source_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(source_well.get_top(0)).then_return(well_top_point)
    decoy.when(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="retract end",
                pipetting_action="aspirate",
            ),
            logger=matchers.Anything(),
        )
    ).then_raise(RuntimeError("Oh no!"))
    with pytest.raises(RuntimeError, match="Oh no!"):
        subject.retract_after_aspiration(volume=40)


def test_retract_after_aspiration_without_touch_tip_and_delay(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should execute steps to retract from well after an aspiration without a touch tip or delay."""
    source_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.aspirate.retract.air_gap_by_volume.set_for_volume(
        40, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    sample_transfer_props.aspirate.retract.touch_tip.enabled = False
    sample_transfer_props.aspirate.retract.delay.enabled = False

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=source_well,
        tip_state=TipState(
            ready_to_aspirate=True,
            last_liquid_and_air_gap_in_tip=LiquidAndAirGapPair(
                liquid=10,
                air_gap=0,
            ),
        ),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(source_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(source_well.get_top(0)).then_return(well_top_point)
    # Assume air gap safe location is below retract location
    decoy.when(source_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 3)
    )
    subject.retract_after_aspiration(volume=40)

    decoy.verify(
        mock_instrument_core.move_to(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=air_gap_flow_rate_by_vol,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
    )


def test_retract_after_aspiration_for_consolidate(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should execute steps to retract from well after an aspiration during a MANY_TO_ONE transfer."""
    source_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    decoy.when(mock_instrument_core.get_current_volume()).then_return(12.3)
    sample_transfer_props.aspirate.retract.air_gap_by_volume.set_for_volume(
        12.3, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        12.3 + air_gap_volume, air_gap_correction_by_vol
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=source_well,
        tip_state=TipState(),
        transfer_type=TransferType.MANY_TO_ONE,
    )
    decoy.when(source_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(source_well.get_top(0)).then_return(well_top_point)
    # Assume air gap safe location is below retract location
    decoy.when(source_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 3)
    )
    subject.retract_after_aspiration(volume=40)

    decoy.verify(
        mock_instrument_core.move_to(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.delay(20),
        mock_instrument_core.touch_tip(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            radius=1,
            mm_from_edge=0.5,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(x=4, y=4, z=4), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=air_gap_flow_rate_by_vol,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
    )


"""
Single dispense properties:

"singleDispense": {
    "submerge": {
      "startPosition": {"positionReference": "well-top", "offset": {"x": 30, "y": 20, "z": 10}},
      "speed": 100,
      "delay": {"enable": true, "params": { "duration": 0.0 }}
    },
    "retract": {
      "endPosition": {"positionReference": "well-top", "offset": {"x": 11, "y": 22, "z": 33}},
      "speed": 50,
      "airGapByVolume": [[1.0, 0.1], [49.9, 0.1], [50.0, 0.0]],
      "blowout": { "enable": true , "params": {"location": "source", "flowRate": 100}},
      "touchTip": { "enable": true, "params": { "zOffset": -1, "mmFromEdge": 0.5, "speed": 30}},
      "delay": {"enable": true, "params": { "duration": 10 }}
    },
    "dispensePosition": {"positionReference": "well-bottom", "offset": {"x": 33, "y": 22, "z": 11}},
    "flowRateByVolume": [[1.0, 50.0]],
    "correctionByVolume": [[0.0, 0.0]],
    "mix": { "enable": true, "params": { "repetitions": 1, "volume": 50 }},
    "pushOutByVolume": [[1.0, 7.0], [4.999, 7.0], [5.0, 2.0], [10.0, 2.0], [50.0, 2.0]],
    "delay": { "enable": true, "params": { "duration": 0.2 }},
}
"""


@pytest.mark.parametrize(
    "add_final_air_gap",
    [True, False],
)
def test_retract_after_dispense_with_blowout_in_source(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    add_final_air_gap: bool,
) -> None:
    """It should execute steps to retract from well after a dispense."""
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.dispense.retract.air_gap_by_volume.set_for_volume(
        0, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=dest_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(dest_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    decoy.when(source_well.get_top(0)).then_return(Point(10, 20, 30))
    # Assume air gap safe location is below retract location
    decoy.when(dest_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 35)
    )
    # Assume air gap safe location for air-gapping at src is below blowout position,
    # where blowout position is source well top
    decoy.when(source_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(10, 20, 29)
    )
    subject.retract_after_dispensing(
        trash_location=Location(Point(), labware=None),
        source_location=source_location,
        source_well=source_well,
        add_final_air_gap=add_final_air_gap,
    )
    decoy.verify(
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.delay(10),
        mock_instrument_core.touch_tip(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            radius=1,
            mm_from_edge=0.75,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=air_gap_flow_rate_by_vol,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
        mock_instrument_core.blow_out(
            location=Location(Point(10, 20, 30), labware=None),
            well_core=source_well,
            in_place=False,
            flow_rate=100,
        ),
        mock_instrument_core.touch_tip(
            location=Location(Point(10, 20, 30), labware=None),
            well_core=source_well,
            radius=1,
            mm_from_edge=0.75,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(10, 20, 30), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.prepare_to_aspirate(),
        *(
            add_final_air_gap
            and [
                mock_instrument_core.air_gap_in_place(  # type: ignore[func-returns-value]
                    volume=air_gap_volume,
                    flow_rate=air_gap_flow_rate_by_vol,
                    correction_volume=air_gap_correction_by_vol,
                ),
                mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
            ]
            or []
        ),
    )


@pytest.mark.parametrize(
    "add_final_air_gap",
    [True, False],
)
def test_retract_after_dispense_with_blowout_in_destination(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    add_final_air_gap: bool,
) -> None:
    """It should execute steps to retract from well after a dispense."""
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.aspirate.retract.air_gap_by_volume.set_for_volume(
        0,
        1234,  # Explicitly check that this value is not used during post-dispense air gap
    )
    sample_transfer_props.dispense.retract.air_gap_by_volume.set_for_volume(
        0, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    sample_transfer_props.dispense.retract.blowout.location = cast(
        str, BlowoutLocation.DESTINATION
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=dest_well,
        tip_state=TipState(
            ready_to_aspirate=True,
            last_liquid_and_air_gap_in_tip=LiquidAndAirGapPair(
                liquid=10,
                air_gap=0,
            ),
        ),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(dest_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    # Assume air gap safe location is below retract location
    decoy.when(dest_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 35)
    )
    subject.retract_after_dispensing(
        trash_location=Location(Point(), labware=None),
        source_location=Location(Point(1, 2, 3), labware=None),
        source_well=source_well,
        add_final_air_gap=True,
    )
    decoy.verify(
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.delay(10),
        mock_instrument_core.blow_out(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            in_place=True,
            flow_rate=100,
        ),
        mock_instrument_core.touch_tip(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            radius=1,
            mm_from_edge=0.75,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        *(
            add_final_air_gap
            and [
                mock_instrument_core.air_gap_in_place(  # type: ignore[func-returns-value]
                    volume=air_gap_volume,
                    flow_rate=air_gap_flow_rate_by_vol,
                    correction_volume=air_gap_correction_by_vol,
                ),
                mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
            ]
            or []
        ),
    )


@pytest.mark.parametrize(
    "add_final_air_gap",
    [True, False],
)
def test_retract_after_dispense_with_blowout_in_trash_well(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    add_final_air_gap: bool,
) -> None:
    """It should execute steps to retract from well after a dispense."""
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    trash_well = decoy.mock(cls=Well)
    trash_well_core = decoy.mock(cls=WellCore)
    trash_location = Location(Point(7, 8, 9), labware=trash_well)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.dispense.retract.air_gap_by_volume.set_for_volume(
        0, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    sample_transfer_props.dispense.retract.blowout.location = cast(
        str, BlowoutLocation.TRASH
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=dest_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(dest_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    decoy.when(trash_well._core).then_return(trash_well_core)
    # Assume air gap safe location is below retract location
    decoy.when(dest_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 35)
    )
    # Assume air gap safe location for air-gapping at src is below touch-tip position,
    # where touch tip position is source well top
    decoy.when(trash_well_core.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(7, 8, 8)
    )
    subject.retract_after_dispensing(
        trash_location=trash_location,
        source_location=source_location,
        source_well=source_well,
        add_final_air_gap=True,
    )
    decoy.verify(
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.delay(10),
        mock_instrument_core.touch_tip(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            radius=1,
            mm_from_edge=0.75,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=air_gap_flow_rate_by_vol,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
        mock_instrument_core.blow_out(
            location=trash_location,
            well_core=trash_well_core,
            in_place=False,
            flow_rate=100,
        ),
        mock_instrument_core.touch_tip(
            location=trash_location,
            well_core=trash_well_core,
            radius=1,
            mm_from_edge=0.75,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=trash_location,
            well_core=trash_well_core,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        *(
            add_final_air_gap
            and [
                mock_instrument_core.air_gap_in_place(  # type: ignore[func-returns-value]
                    volume=air_gap_volume,
                    flow_rate=air_gap_flow_rate_by_vol,
                    correction_volume=air_gap_correction_by_vol,
                ),
                mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
            ]
            or []
        ),
    )


@pytest.mark.parametrize(
    "add_final_air_gap",
    [True, False],
)
def test_retract_after_dispense_with_blowout_in_disposal_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    add_final_air_gap: bool,
) -> None:
    """It should execute steps to retract from well after a dispense."""
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    trash_location = decoy.mock(cls=TrashBin)
    trash_top = decoy.mock(cls=TrashBin)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.dispense.retract.air_gap_by_volume.set_for_volume(
        0, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    sample_transfer_props.dispense.retract.blowout.location = cast(
        str, BlowoutLocation.TRASH
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=dest_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(dest_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    # Assume air gap safe location is below retract location
    decoy.when(dest_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 35)
    )
    decoy.when(trash_location.offset).then_return(DisposalOffset(x=4, y=5, z=6))
    decoy.when(trash_location.top(x=0, y=0, z=2)).then_return(trash_top)
    decoy.when(trash_top.offset).then_return(DisposalOffset(x=1, y=2, z=3))
    subject.retract_after_dispensing(
        trash_location=trash_location,
        source_location=source_location,
        source_well=source_well,
        add_final_air_gap=True,
    )
    decoy.verify(
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.delay(10),
        mock_instrument_core.touch_tip(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            radius=1,
            mm_from_edge=0.75,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=air_gap_flow_rate_by_vol,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
        mock_instrument_core.blow_out(
            location=trash_location,
            well_core=None,
            in_place=False,
            flow_rate=100,
        ),
        *(
            add_final_air_gap
            and [
                mock_instrument_core.air_gap_in_place(  # type: ignore[func-returns-value]
                    volume=air_gap_volume,
                    flow_rate=air_gap_flow_rate_by_vol,
                    correction_volume=air_gap_correction_by_vol,
                ),
                mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
            ]
            or []
        ),
    )


@pytest.mark.parametrize(
    "add_final_air_gap",
    [True, False],
)
def test_retract_after_dispense_in_trash_with_blowout_in_source(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    add_final_air_gap: bool,
) -> None:
    """It should execute steps to retract after a dispense into a trash."""
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    target_chute = decoy.mock(cls=WasteChute)
    chute_top = decoy.mock(cls=WasteChute)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.dispense.retract.air_gap_by_volume.set_for_volume(
        0, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=target_chute,
        target_well=None,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )

    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(source_well.get_top(0)).then_return(Point(10, 20, 30))
    # Assume air gap safe location for air-gapping at src is below touch-tip position,
    # where touch tip position is source well top
    decoy.when(source_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(10, 20, 29)
    )
    decoy.when(target_chute.offset).then_return(DisposalOffset(x=4, y=5, z=6))
    decoy.when(target_chute.top(x=0, y=0, z=2)).then_return(chute_top)
    decoy.when(chute_top.offset).then_return(DisposalOffset(x=1, y=2, z=3))
    subject.retract_after_dispensing(
        trash_location=Location(Point(), labware=None),
        source_location=source_location,
        source_well=source_well,
        add_final_air_gap=add_final_air_gap,
    )
    decoy.verify(
        mock_instrument_core.delay(10),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=air_gap_flow_rate_by_vol,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
        mock_instrument_core.blow_out(
            location=Location(Point(10, 20, 30), labware=None),
            well_core=source_well,
            in_place=False,
            flow_rate=100,
        ),
        mock_instrument_core.touch_tip(
            location=Location(Point(10, 20, 30), labware=None),
            well_core=source_well,
            radius=1,
            mm_from_edge=0.75,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(10, 20, 30), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.prepare_to_aspirate(),
        *(
            add_final_air_gap
            and [
                mock_instrument_core.air_gap_in_place(  # type: ignore[func-returns-value]
                    volume=air_gap_volume,
                    flow_rate=air_gap_flow_rate_by_vol,
                    correction_volume=air_gap_correction_by_vol,
                ),
                mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
            ]
            or []
        ),
    )


@pytest.mark.parametrize(
    "add_final_air_gap",
    [True, False],
)
def test_retract_after_dispense_in_trash_with_blowout_in_destination(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    add_final_air_gap: bool,
) -> None:
    """It should execute steps to retract after a dispense into a trash."""
    source_well = decoy.mock(cls=WellCore)
    target_trash = decoy.mock(cls=TrashBin)
    trash_top = decoy.mock(cls=TrashBin)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.dispense.retract.air_gap_by_volume.set_for_volume(
        0, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    sample_transfer_props.dispense.retract.blowout.location = cast(
        str, BlowoutLocation.DESTINATION
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=target_trash,
        target_well=None,
        tip_state=TipState(
            ready_to_aspirate=True,
            last_liquid_and_air_gap_in_tip=LiquidAndAirGapPair(
                liquid=10,
                air_gap=0,
            ),
        ),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(target_trash.offset).then_return(DisposalOffset(x=4, y=5, z=6))
    decoy.when(target_trash.top(x=0, y=0, z=2)).then_return(trash_top)
    decoy.when(trash_top.offset).then_return(DisposalOffset(x=1, y=2, z=3))
    subject.retract_after_dispensing(
        trash_location=Location(Point(), labware=None),
        source_location=Location(Point(1, 2, 3), labware=None),
        source_well=source_well,
        add_final_air_gap=True,
    )
    decoy.verify(
        mock_instrument_core.delay(10),
        mock_instrument_core.blow_out(
            location=target_trash,
            well_core=None,
            in_place=True,
            flow_rate=100,
        ),
        *(
            add_final_air_gap
            and [
                mock_instrument_core.air_gap_in_place(  # type: ignore[func-returns-value]
                    volume=air_gap_volume,
                    flow_rate=air_gap_flow_rate_by_vol,
                    correction_volume=air_gap_correction_by_vol,
                ),
                mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
            ]
            or []
        ),
    )


@pytest.mark.parametrize(
    "add_final_air_gap",
    [True, False],
)
def test_retract_after_dispense_in_trash_with_blowout_in_disposal_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    add_final_air_gap: bool,
) -> None:
    """It should execute steps to retract after a dispense into a trash."""
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    target_trash = decoy.mock(cls=TrashBin)
    target_trash_top = decoy.mock(cls=TrashBin)
    trash_location = decoy.mock(cls=WasteChute)
    waste_chute_top = decoy.mock(cls=WasteChute)

    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.dispense.retract.air_gap_by_volume.set_for_volume(
        0, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    sample_transfer_props.dispense.retract.blowout.location = cast(
        str, BlowoutLocation.TRASH
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=target_trash,
        target_well=None,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(target_trash.offset).then_return(DisposalOffset(x=4, y=5, z=6))
    decoy.when(target_trash.top(x=0, y=0, z=2)).then_return(target_trash_top)
    decoy.when(target_trash_top.offset).then_return(DisposalOffset(x=1, y=2, z=3))
    decoy.when(trash_location.offset).then_return(DisposalOffset(x=4, y=5, z=6))
    decoy.when(trash_location.top(x=0, y=0, z=2)).then_return(waste_chute_top)
    decoy.when(waste_chute_top.offset).then_return(DisposalOffset(x=1, y=2, z=3))
    subject.retract_after_dispensing(
        trash_location=trash_location,
        source_location=source_location,
        source_well=source_well,
        add_final_air_gap=True,
    )
    decoy.verify(
        mock_instrument_core.delay(10),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=air_gap_flow_rate_by_vol,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
        mock_instrument_core.blow_out(
            location=trash_location,
            well_core=None,
            in_place=False,
            flow_rate=100,
        ),
        *(
            add_final_air_gap
            and [
                mock_instrument_core.air_gap_in_place(  # type: ignore[func-returns-value]
                    volume=air_gap_volume,
                    flow_rate=air_gap_flow_rate_by_vol,
                    correction_volume=air_gap_correction_by_vol,
                ),
                mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
            ]
            or []
        ),
    )


@pytest.mark.parametrize(
    argnames=[
        "blowout_location",
        "blowout_position",
        "blowout_position_reference_point",
        "expected_blowout_point",
    ],
    argvalues=[
        (
            "trash",
            {"position_reference": "well-top", "offset": {"x": 1, "y": 2, "z": 3}},
            Point(1, 2, 3),  # Well-top point
            Point(2, 4, 6),
        ),
        (
            "destination",
            {
                "position_reference": "well-center",
                "offset": {"x": 10, "y": 20, "z": 30},
            },
            Point(1, 1, 1),  # Well-center point
            Point(11, 21, 31),
        ),
        (
            "source",
            {
                "position_reference": "well-bottom",
                "offset": {"x": 100, "y": 200, "z": 300},
            },
            Point(0, 0, 0),  # Well-bottom point
            Point(100, 200, 300),
        ),
    ],
)
def test_retract_after_dispense_with_blowout_position_set(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    blowout_location: str,
    blowout_position: TipPositionDict,
    blowout_position_reference_point: Point,
    expected_blowout_point: Point,
) -> None:
    """It should use the blowout position for destination blowout."""
    source_well_core = decoy.mock(cls=WellCore)
    source_well = decoy.mock(cls=Well)
    source_location = Location(Point(1, 2, 3), labware=source_well)

    trash_well_core = decoy.mock(cls=WellCore)
    trash_well = decoy.mock(cls=Well)
    trash_location = Location(Point(4, 5, 6), labware=trash_well)

    dest_well_core = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=Well)

    blowout_well_core = {
        "trash": trash_well_core,
        "destination": dest_well_core,
        "source": source_well_core,
    }[blowout_location]
    blowout_well = {
        "trash": trash_well,
        "destination": dest_well,
        "source": source_well,
    }[blowout_location]

    well_top_point = Point(1, 2, 3)
    sample_transfer_props.dispense.retract.blowout.location = blowout_location
    sample_transfer_props.dispense.retract.blowout.blowout_position = blowout_position
    # Disable touch tip so we don't have to mock out touch tip related functions
    sample_transfer_props.dispense.retract.touch_tip.enabled = False
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=dest_well),
        target_well=dest_well_core,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(trash_well._core).then_return(trash_well_core)
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(dest_well_core.get_top(0)).then_return(well_top_point)
    decoy.when(source_well_core.get_top(0)).then_return(well_top_point)

    for well_core in [trash_well_core, source_well_core, dest_well_core]:
        decoy.when(well_core.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
            Point(10, 20, 29)
        )
    decoy.when(trash_well_core.get_top(0)).then_return(blowout_position_reference_point)
    decoy.when(dest_well_core.get_center()).then_return(
        blowout_position_reference_point
    )
    decoy.when(source_well_core.get_bottom(0)).then_return(
        blowout_position_reference_point
    )

    subject.retract_after_dispensing(
        trash_location=trash_location,
        source_location=source_location,
        source_well=source_well_core,
        add_final_air_gap=False,
    )
    decoy.verify(
        mock_instrument_core.blow_out(
            location=Location(expected_blowout_point, labware=blowout_well),
            well_core=blowout_well_core,
            in_place=False,
            flow_rate=100,
        )
    )


def test_retract_after_dispense_with_blowout_position_for_trashbin(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should use the blowout position for destination blowout."""
    trash_location = decoy.mock(cls=TrashBin)
    expected_blowout_trash_location = decoy.mock(
        cls=WasteChute
    )  # Use waste chute just to make the expected result object distinct

    source_well_core = decoy.mock(cls=WellCore)
    source_location = Location(Point(1, 2, 3), labware=decoy.mock(cls=Well))
    dest_well_core = decoy.mock(cls=WellCore)
    dest_location = Location(Point(1, 1, 1), labware=decoy.mock(cls=Well))

    well_top_point = Point(1, 2, 3)
    sample_transfer_props.dispense.retract.blowout.location = "trash"
    sample_transfer_props.dispense.retract.blowout.blowout_position = {
        "position_reference": "well-center",
        "offset": {"x": 10, "y": 20, "z": 30},
    }
    # Disable touch tip so we don't have to mock out touch tip related functions
    sample_transfer_props.dispense.retract.touch_tip.enabled = False
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=dest_location,
        target_well=dest_well_core,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(dest_well_core.get_top(0)).then_return(well_top_point)

    for well_core in [source_well_core, dest_well_core]:
        decoy.when(well_core.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
            Point(10, 20, 29)
        )

    decoy.when(
        trash_location.top(x=0, y=0, z=AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)
    ).then_return(trash_location)
    decoy.when(trash_location.offset).then_return(DisposalOffset(x=10, y=20, z=30))
    decoy.when(
        tx_utils.get_blowout_location_for_trash(
            trash_location,
            sample_transfer_props.dispense.retract.blowout.blowout_position,  # type: ignore[arg-type]
        )
    ).then_return(expected_blowout_trash_location)

    subject.retract_after_dispensing(
        trash_location=trash_location,
        source_location=source_location,
        source_well=source_well_core,
        add_final_air_gap=False,
    )
    decoy.verify(
        mock_instrument_core.blow_out(
            location=expected_blowout_trash_location,
            well_core=None,
            in_place=False,
            flow_rate=100,
        )
    )


def test_retract_after_dispense_with_blowout_in_trash_destination(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should blowout at the specified position in a trash destination."""
    dest_location = decoy.mock(cls=WasteChute)
    expected_blowout_dest_location = decoy.mock(
        cls=TrashBin
    )  # Use trash bin just to make the expected result object distinct

    source_well_core = decoy.mock(cls=WellCore)
    source_location = Location(Point(1, 2, 3), labware=decoy.mock(cls=Well))

    trash_well_core = decoy.mock(cls=WellCore)
    trash_location = Location(Point(4, 5, 6), labware=decoy.mock(cls=Well))

    sample_transfer_props.dispense.retract.blowout.location = "destination"
    sample_transfer_props.dispense.retract.blowout.blowout_position = {
        "position_reference": "well-center",
        "offset": {"x": 10, "y": 20, "z": 30},
    }
    # Disable touch tip so we don't have to mock out touch tip related functions
    sample_transfer_props.dispense.retract.touch_tip.enabled = False
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=dest_location,
        target_well=None,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    for well_core in [source_well_core, trash_well_core]:
        decoy.when(well_core.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
            Point(10, 20, 29)
        )

    decoy.when(
        dest_location.top(x=0, y=0, z=AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)
    ).then_return(dest_location)
    decoy.when(dest_location.offset).then_return(DisposalOffset(x=10, y=20, z=30))
    decoy.when(
        tx_utils.get_blowout_location_for_trash(
            dest_location,
            sample_transfer_props.dispense.retract.blowout.blowout_position,  # type: ignore[arg-type]
        )
    ).then_return(expected_blowout_dest_location)

    subject.retract_after_dispensing(
        trash_location=trash_location,
        source_location=source_location,
        source_well=source_well_core,
        add_final_air_gap=False,
    )
    decoy.verify(
        mock_instrument_core.blow_out(
            location=expected_blowout_dest_location,
            well_core=None,
            in_place=False,
            flow_rate=100,
        )
    )


# Try all combinations of destination type, blowout location, and touchability
@pytest.mark.parametrize("dest_type", ["well", "trash"])
@pytest.mark.parametrize("blowout_location", [bl for bl in BlowoutLocation])
@pytest.mark.parametrize("source_touchable", [True, False])
def test_retract_after_dispense_touch_tip(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    dest_type: Literal["well", "trash"],
    blowout_location: BlowoutLocation,
    source_touchable: bool,
) -> None:
    """Should not fail if touchTipDisabled at the blowout location if blowing out to SOURCE."""
    source_location_labware = decoy.mock(cls=Labware)
    source_location = Location(Point(1, 2, 3), labware=source_location_labware)
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    trash_location = decoy.mock(cls=TrashBin)
    trash_top = decoy.mock(cls=TrashBin)

    target_location: Union[Location, TrashBin, WasteChute]
    if dest_type == "trash":
        target_location = trash_location
        target_well = None
    else:  # dest_type == "well"
        target_location = Location(Point(1, 1, 1), labware=None)
        target_well = dest_well

    sample_transfer_props.dispense.retract.touch_tip.enabled = True
    sample_transfer_props.dispense.retract.blowout.enabled = True
    sample_transfer_props.dispense.retract.blowout.location = cast(
        str, blowout_location
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=target_location,
        target_well=target_well,
        tip_state=TipState(
            ready_to_aspirate=True,
            last_liquid_and_air_gap_in_tip=LiquidAndAirGapPair(liquid=0, air_gap=0),
        ),
        transfer_type=TransferType.ONE_TO_ONE,
    )

    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(source_location_labware.quirks).then_return(
        [] if source_touchable else ["touchTipDisabled"]
    )
    decoy.when(source_well.get_top(0)).then_return(well_top_point)
    decoy.when(source_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        well_top_point + Point(0, 0, AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)
    )
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    decoy.when(dest_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        well_top_point + Point(0, 0, AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)
    )
    decoy.when(trash_location.offset).then_return(DisposalOffset(x=0, y=0, z=0))
    decoy.when(
        trash_location.top(x=0, y=0, z=AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)
    ).then_return(trash_top)
    decoy.when(trash_top.offset).then_return(
        DisposalOffset(x=0, y=0, z=AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)
    )

    subject.retract_after_dispensing(
        trash_location=trash_location,
        source_location=source_location,
        source_well=source_well,
        add_final_air_gap=False,
    )

    decoy.verify(
        mock_instrument_core.touch_tip(
            location=matchers.Anything(),
            well_core=matchers.Anything(),
            radius=matchers.Anything(),
            z_offset=matchers.Anything(),
            speed=matchers.Anything(),
        ),
        ignore_extra_args=True,
        times={
            # (destination type, blowout location, source touchable):
            ("well", BlowoutLocation.SOURCE, True): 2,  # touch dest, touch source
            ("well", BlowoutLocation.SOURCE, False): 1,  # touch dest, no touch source
            ("well", BlowoutLocation.DESTINATION, True): 1,  # touch dest
            ("well", BlowoutLocation.DESTINATION, False): 1,  # touch dest
            ("well", BlowoutLocation.TRASH, True): 1,  # touch dest
            ("well", BlowoutLocation.TRASH, False): 1,  # touch dest
            ("trash", BlowoutLocation.SOURCE, True): 1,  # touch source
            ("trash", BlowoutLocation.SOURCE, False): 0,  # don't touch source
            ("trash", BlowoutLocation.DESTINATION, True): 0,
            ("trash", BlowoutLocation.DESTINATION, False): 0,
            ("trash", BlowoutLocation.TRASH, True): 0,
            ("trash", BlowoutLocation.TRASH, False): 0,
        }[dest_type, blowout_location, source_touchable],
    )


def test_retract_after_dispense_raises_for_invalid_retract_point(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should raise an error if the retract end point is deemed bad."""
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=dest_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(dest_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    decoy.when(source_well.get_top(0)).then_return(Point(10, 20, 30))
    decoy.when(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="retract end",
                pipetting_action="dispense",
            ),
            logger=matchers.Anything(),
        )
    ).then_raise(RuntimeError("Oh no!"))
    with pytest.raises(RuntimeError, match="Oh no!"):
        subject.retract_after_dispensing(
            trash_location=Location(Point(), labware=None),
            source_location=source_location,
            source_well=source_well,
            add_final_air_gap=True,
        )


def test_retract_after_dispense_with_blowout_in_src_moves_to_safe_loc_for_air_gap(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should retract after a dispense and move to safe location for air gap at dest well and source well."""
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.dispense.retract.air_gap_by_volume.set_for_volume(
        0, air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=dest_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_ONE,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(dest_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    decoy.when(source_well.get_top(0)).then_return(Point(10, 20, 30))
    # Assume air gap safe location is above retract location
    decoy.when(dest_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 37)
    )
    # Assume air gap safe location for air-gapping at src is above blowout position,
    # where blowout position is source well top (as set above)
    decoy.when(source_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(10, 20, 31)
    )
    subject.retract_after_dispensing(
        trash_location=Location(Point(), labware=None),
        source_location=source_location,
        source_well=source_well,
        add_final_air_gap=True,
    )
    decoy.verify(
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.delay(10),
        mock_instrument_core.touch_tip(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            radius=1,
            mm_from_edge=0.75,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 36), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(12, 24, 37), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.air_gap_in_place(
            volume=air_gap_volume,
            flow_rate=air_gap_flow_rate_by_vol,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),
        mock_instrument_core.blow_out(
            location=Location(Point(10, 20, 30), labware=None),
            well_core=source_well,
            in_place=False,
            flow_rate=100,
        ),
        mock_instrument_core.touch_tip(
            location=Location(Point(10, 20, 30), labware=None),
            well_core=source_well,
            radius=1,
            mm_from_edge=0.75,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(10, 20, 30), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(10, 20, 31), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.prepare_to_aspirate(),
        mock_instrument_core.air_gap_in_place(
            # type: ignore[func-returns-value]
            volume=air_gap_volume,
            flow_rate=air_gap_flow_rate_by_vol,
            correction_volume=air_gap_correction_by_vol,
        ),
        mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
    )


@pytest.mark.parametrize(
    argnames=["is_last_retract", "add_final_air_gap", "expect_air_gap"],
    argvalues=[
        (True, False, False),
        (False, False, False),
        (True, True, True),
        (False, True, True),
    ],
)
def test_multi_dispense_retract_after_dispense_without_conditioning_volume_or_blowout(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    is_last_retract: bool,
    add_final_air_gap: bool,
    expect_air_gap: bool,
) -> None:
    """It should execute retract steps.

    Should execute steps, including expected air gaps, to retract from well during
    a multi-dispense when there's no conditioning volume, no disposal volume and no blowout.
    """
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    sample_transfer_props.multi_dispense.retract.touch_tip.enabled = True  # type: ignore[union-attr]
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.multi_dispense.retract.air_gap_by_volume.set_for_volume(  # type: ignore[union-attr]
        100, 51
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        51, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        51, air_gap_correction_by_vol
    )
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=dest_well,
        tip_state=TipState(
            ready_to_aspirate=True,
            last_liquid_and_air_gap_in_tip=LiquidAndAirGapPair(
                # Since we'll be testing retract_during_multi_dispensing right after
                # initializing the executor, this is the tip state that retract_during_multi_dispensing
                # will start with.
                liquid=100,
                air_gap=0,
            ),
        ),
        transfer_type=TransferType.ONE_TO_MANY,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    # Assume air gap safe location is below retract location
    decoy.when(dest_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 3)
    )
    subject.retract_during_multi_dispensing(
        trash_location=Location(Point(), labware=None),
        source_location=source_location,
        source_well=source_well,
        conditioning_volume=0,
        add_final_air_gap=add_final_air_gap,
        is_last_retract=is_last_retract,
    )
    decoy.verify(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(3, 5, 4), labware=None),
            well_core=dest_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="retract end",
                pipetting_action="dispense",
            ),
            logger=matchers.Anything(),
        ),
        mock_instrument_core.move_to(
            location=Location(Point(3, 5, 4), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        mock_instrument_core.touch_tip(
            location=Location(Point(3, 5, 4), labware=None),
            well_core=dest_well,
            radius=1,
            mm_from_edge=0.5,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(3, 5, 4), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        *(
            expect_air_gap
            and [
                mock_instrument_core.air_gap_in_place(
                    # type: ignore[func-returns-value]
                    volume=51,
                    flow_rate=air_gap_flow_rate_by_vol,
                    correction_volume=air_gap_correction_by_vol,
                ),
                mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
            ]
            or []
        ),
    )


@pytest.mark.parametrize(
    argnames=[
        "is_last_retract",
        "add_final_air_gap",
        "expect_blowout",
        "expect_air_gap",
    ],
    argvalues=[
        (True, False, True, False),
        (False, False, False, False),
        (True, True, True, True),
        (False, True, False, True),
    ],
)
def test_multi_dispense_retract_after_dispense_with_blowout_without_conditioning_volume(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
    is_last_retract: bool,
    add_final_air_gap: bool,
    expect_air_gap: bool,
    expect_blowout: bool,
) -> None:
    """It should execute retract steps.

    Should execute steps, including expected air gaps, to retract from well during a
    multi-dispense when there's no conditioning volume while blowout is enabled.
    """
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    air_gap_volume = 0.123
    air_gap_flow_rate_by_vol = 123
    air_gap_correction_by_vol = 0.321

    sample_transfer_props.multi_dispense.retract.air_gap_by_volume.set_for_all_volumes(  # type: ignore[union-attr]
        air_gap_volume
    )
    sample_transfer_props.aspirate.flow_rate_by_volume.set_for_volume(
        air_gap_volume, air_gap_flow_rate_by_vol
    )
    sample_transfer_props.aspirate.correction_by_volume.set_for_volume(
        air_gap_volume, air_gap_correction_by_vol
    )

    sample_transfer_props.multi_dispense.retract.touch_tip.enabled = True  # type: ignore[union-attr]
    sample_transfer_props.multi_dispense.retract.blowout.enabled = True  # type: ignore[union-attr]

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=dest_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_MANY,
    )
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    # Assume air gap safe location is below retract location
    decoy.when(dest_well.get_top(AIR_GAP_LOC_Z_OFFSET_FROM_WELL_TOP)).then_return(
        Point(1, 2, 3)
    )
    subject.retract_during_multi_dispensing(
        trash_location=Location(Point(), labware=None),
        source_location=source_location,
        source_well=source_well,
        conditioning_volume=0,
        add_final_air_gap=add_final_air_gap,
        is_last_retract=is_last_retract,
    )
    decoy.verify(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(3, 5, 4), labware=None),
            well_core=dest_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="retract end",
                pipetting_action="dispense",
            ),
            logger=matchers.Anything(),
        ),
        mock_instrument_core.move_to(
            location=Location(Point(3, 5, 4), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=50,
        ),
        *(
            expect_blowout
            and [
                mock_instrument_core.blow_out(  # type: ignore[func-returns-value]
                    location=Location(Point(3, 5, 4), labware=None),
                    well_core=dest_well,
                    in_place=True,
                    flow_rate=10,
                )
            ]
            or []
        ),
        mock_instrument_core.touch_tip(
            location=Location(Point(3, 5, 4), labware=None),
            well_core=dest_well,
            radius=1,
            mm_from_edge=0.5,
            z_offset=-1,
            speed=30,
        ),
        mock_instrument_core.move_to(
            location=Location(Point(3, 5, 4), labware=None),
            well_core=dest_well,
            force_direct=True,
            minimum_z_height=None,
            speed=None,
        ),
        *(
            expect_air_gap
            and [
                mock_instrument_core.air_gap_in_place(
                    # type: ignore[func-returns-value]
                    volume=air_gap_volume,
                    flow_rate=air_gap_flow_rate_by_vol,
                    correction_volume=air_gap_correction_by_vol,
                ),
                mock_instrument_core.delay(0.2),  # type: ignore[func-returns-value]
            ]
            or []
        ),
    )
    assert subject.tip_state.last_liquid_and_air_gap_in_tip == LiquidAndAirGapPair(
        air_gap=air_gap_volume if expect_air_gap else 0, liquid=0
    )


def test_multi_dispense_retract_raises_for_invalid_retract_point(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """It should raise an error if the retract end point is deemed bad."""
    source_location = Location(Point(1, 2, 3), labware=None)
    source_well = decoy.mock(cls=WellCore)
    dest_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(1, 1, 1), labware=None),
        target_well=dest_well,
        tip_state=TipState(),
        transfer_type=TransferType.ONE_TO_MANY,
    )
    decoy.when(dest_well.get_top(0)).then_return(well_top_point)
    decoy.when(
        tx_utils.raise_if_location_inside_liquid(
            location=Location(Point(3, 5, 4), labware=None),
            well_core=dest_well,
            location_check_descriptors=LocationCheckDescriptors(
                location_type="retract end",
                pipetting_action="dispense",
            ),
            logger=matchers.Anything(),
        )
    ).then_raise(RuntimeError("Oh no!"))
    with pytest.raises(RuntimeError, match="Oh no!"):
        subject.retract_during_multi_dispensing(
            trash_location=Location(Point(), labware=None),
            source_location=source_location,
            source_well=source_well,
            conditioning_volume=0,
            add_final_air_gap=True,
            is_last_retract=False,
        )


@pytest.mark.parametrize(
    argnames=["position_reference", "offset", "expected_result"],
    argvalues=[
        (PositionReference.WELL_TOP, Coordinate(x=11, y=12, z=13), Point(12, 14, 16)),
        (
            PositionReference.WELL_BOTTOM,
            Coordinate(x=21, y=22, z=23),
            Point(25, 27, 29),
        ),
        (
            PositionReference.WELL_CENTER,
            Coordinate(x=31, y=32, z=33),
            Point(38, 40, 42),
        ),
        (
            PositionReference.LIQUID_MENISCUS,
            Coordinate(x=41, y=42, z=43),
            Point(45, 47, 61),
        ),
    ],
)
def test_absolute_point_from_position_reference_and_offset(
    decoy: Decoy,
    position_reference: PositionReference,
    offset: Coordinate,
    expected_result: Point,
) -> None:
    """It should return the correct absolute point based on well, position reference and offset."""
    well = decoy.mock(cls=WellCore)

    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    well_center_point = Point(7, 8, 9)
    estimated_liquid_height = 12
    decoy.when(well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(well.get_top(0)).then_return(well_top_point)
    decoy.when(well.get_center()).then_return(well_center_point)
    decoy.when(
        well.estimate_liquid_height_after_pipetting(
            operation_volume=123, mount=Mount.RIGHT
        ),
    ).then_return(estimated_liquid_height)
    decoy.when(well.get_bottom(12)).then_return(Point(4, 5, 18))

    assert (
        absolute_point_from_position_reference_and_offset(
            well=well,
            well_volume_difference=123,
            position_reference=position_reference,
            offset=offset,
            mount=Mount.RIGHT,
        )
        == expected_result
    )


def test_absolute_point_from_position_reference_and_offset_raises_errors(
    decoy: Decoy,
) -> None:
    """It should raise errors for invalid input."""
    well = decoy.mock(cls=WellCore)
    with pytest.raises(ValueError, match="Unknown position reference"):
        absolute_point_from_position_reference_and_offset(
            well=well,
            well_volume_difference=123,
            position_reference="PositionReference",  # type: ignore[arg-type]
            offset=Coordinate(x=0, y=0, z=0),
            mount=Mount.RIGHT,
        )
