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
    liquid_class_def = load_definition(liquid_class_name, version=1, schema_version=1)
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
def test_flow_rates_equal_each_other(liquid_class_name: str) -> None:
    """The dispense flow rate values for each pipette/tiprack combo should all be equal to one another."""
    liquid_class_def = load_definition(liquid_class_name, version=1, schema_version=1)
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
