"""Tests for the default values in built-in liquid class definitions."""
import pytest
from typing import List

from opentrons_shared_data import get_shared_data_root
from opentrons_shared_data.liquid_classes import load_definition


def _get_all_liquid_classes() -> List[str]:
    return [
        deffile.stem
        for deffile in (
            get_shared_data_root() / "liquid-class" / "definitions" / "1"
        ).iterdir()
    ]


@pytest.mark.parametrize("liquid_class_name", list(_get_all_liquid_classes()))
def test_correction_values_equal_each_other(liquid_class_name: str) -> None:
    """The correction volume values for each pipette/tiprack combo should all be equal to one another."""
    liquid_class_def = load_definition(liquid_class_name)
    incorrect_combos = []
    for by_pipette in liquid_class_def.byPipette:
        for liquid_class_props in by_pipette.byTipType:
            if liquid_class_props.multiDispense is None:
                continue
            aspirate_correction = liquid_class_props.aspirate.correctionByVolume
            dispense_correction = liquid_class_props.singleDispense.correctionByVolume
            multi_dispense_correction = (
                liquid_class_props.multiDispense.correctionByVolume
            )
            if (
                aspirate_correction != dispense_correction
                or dispense_correction != multi_dispense_correction
            ):
                incorrect_combos.append(
                    f"{by_pipette.pipetteModel} {liquid_class_props.tiprack}"
                )
    assert incorrect_combos == []


@pytest.mark.parametrize("liquid_class_name", list(_get_all_liquid_classes()))
def test_correction_volume_not_negative(liquid_class_name: str) -> None:
    """Correction volumes must not push the plunger below zero position or else PipetteNotReadyToAspirateError."""
    liquid_class_def = load_definition(liquid_class_name)
    for by_pipette in liquid_class_def.byPipette:
        for by_tip_type in by_pipette.byTipType:
            # We just need to check one of aspirate/singleDispense/multiDispense, because
            # the test above ensures that all 3 are the same.
            correction_by_volume = by_tip_type.aspirate.correctionByVolume
            # The correction volume at 0 must be 0:
            assert (
                0.0,
                0.0,
            ) in correction_by_volume, f"Correction volume not 0 at 0 in {by_pipette.pipetteModel} {by_tip_type.tiprack}"
            # The nominal volume + correction volume must never be below 0.
            # (Seth thinks this check is sufficient to ensure that the plunger won't
            # go below the zero position, whereas David thinks we need a stronger
            # check that takes into account ul_per_mm(). But this is a start.)
            for nominal_volume, correction_volume in correction_by_volume:
                assert (
                    nominal_volume + correction_volume >= 0
                ), f"Volume + correction volume is negative in {by_pipette.pipetteModel} {by_tip_type.tiprack}"


@pytest.mark.parametrize("liquid_class_name", list(_get_all_liquid_classes()))
def test_flow_rates_equal_each_other(liquid_class_name: str) -> None:
    """The dispense flow rate values for each pipette/tiprack combo should all be equal to one another."""
    liquid_class_def = load_definition(liquid_class_name)
    incorrect_combos = []
    for by_pipette in liquid_class_def.byPipette:
        for liquid_class_props in by_pipette.byTipType:
            if liquid_class_props.multiDispense is None:
                continue
            dispense_flow_rates = liquid_class_props.singleDispense.flowRateByVolume
            multi_dispense_flow_rates = (
                liquid_class_props.multiDispense.flowRateByVolume
            )
            if dispense_flow_rates != multi_dispense_flow_rates:
                incorrect_combos.append(
                    f"{by_pipette.pipetteModel} {liquid_class_props.tiprack}"
                )
    assert incorrect_combos == []
