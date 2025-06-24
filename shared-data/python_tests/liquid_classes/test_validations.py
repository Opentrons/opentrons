"""Tests that validate the built-in liquid class definitions."""
import pytest
from typing import List

from opentrons_shared_data import get_shared_data_root
from opentrons_shared_data.liquid_classes import load_definition
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    DelayProperties,
    MixProperties,
    TouchTipProperties,
    BlowoutProperties,
    BlowoutLocation,
)


def _get_all_liquid_classes() -> List[str]:
    return [
        deffile.stem
        for deffile in (
            get_shared_data_root() / "liquid-class" / "definitions" / "1"
        ).iterdir()
    ]


@pytest.mark.parametrize("liquid_class_name", list(_get_all_liquid_classes()))
def test_validate_unique_pipette_keys(liquid_class_name: str) -> None:
    """A liquid class definition should contain only one set of properties per pipette model."""
    definition_dict = load_definition(liquid_class_name, version=1, schema_version=1)
    pipette_models = [prop.pipetteModel for prop in definition_dict.byPipette]
    assert len(pipette_models) == len(set(pipette_models))


@pytest.mark.parametrize("liquid_class_name", list(_get_all_liquid_classes()))
def test_validate_unique_tip_keys(liquid_class_name: str) -> None:
    """A liquid class definition should contain only one set of properties per tip type."""
    definition_dict = load_definition(liquid_class_name, version=1, schema_version=1)

    for by_pip_prop in definition_dict.byPipette:
        tipracks = [tip_prop.tiprack for tip_prop in by_pip_prop.byTipType]
        assert len(tipracks) == len(set(tipracks))


def test_validate_delay_properties_dict() -> None:
    """Delay properties model validator should convert valid dict to DelayProperties."""
    obj = DelayProperties.model_validate({"enable": True, "duration": 2})
    assert isinstance(obj, DelayProperties)
    assert obj.enable is True
    assert obj.params.duration == 2  # type: ignore[union-attr]

    with pytest.raises(
        ValueError,
        match="Delay properties should specify either duration or params, not both",
    ):
        DelayProperties.model_validate(
            {"enable": False, "params": {"duration": 2}, "duration": 2}
        )


def test_validate_mix_properties_dict() -> None:
    """Mix properties model validator should convert valid dict to MixProperties."""
    obj = MixProperties.model_validate({"enable": True, "repetitions": 2, "volume": 3})
    assert isinstance(obj, MixProperties)
    assert obj.enable is True
    assert obj.params is not None
    assert obj.params.repetitions == 2
    assert obj.params.volume == 3

    with pytest.raises(
        ValueError,
        match="either all of \\['repetitions', 'volume'\\] or 'params', not both",
    ):
        MixProperties.model_validate(
            {"enable": True, "repetitions": 2, "volume": 3, "params": {"foo": "bar"}}
        )


def test_validate_touchtip_properties_dict() -> None:
    """Touch tip properties model validator should convert valid dict to TouchTipProperties."""
    obj = TouchTipProperties.model_validate(
        {"enable": True, "z_offset": 2, "mm_from_edge": 3, "speed": 4}
    )
    assert isinstance(obj, TouchTipProperties)
    assert obj.enable is True
    assert obj.params is not None
    assert obj.params.mmFromEdge == 3
    assert obj.params.speed == 4
    assert obj.params.zOffset == 2

    with pytest.raises(
        ValueError,
        match="either all of \\['z_offset', 'mm_from_edge', 'speed'\\] or 'params', not both",
    ):
        TouchTipProperties.model_validate(
            {
                "enable": True,
                "z_offset": 2,
                "mm_from_edge": 3,
                "speed": 4,
                "params": {"foo": "bar"},
            }
        )


def test_validate_blowout_properties_dict() -> None:
    """Blowout properties model validator should convert valid dict to BlowoutProperties."""
    obj = BlowoutProperties.model_validate(
        {"enable": True, "location": "source", "flow_rate": 3}
    )
    assert isinstance(obj, BlowoutProperties)
    assert obj.enable is True
    assert obj.params is not None
    assert obj.params.location == BlowoutLocation.SOURCE
    assert obj.params.flowRate == 3

    with pytest.raises(
        ValueError,
        match="either all of \\['location', 'flow_rate'\\] or 'params', not both",
    ):
        BlowoutProperties.model_validate(
            {
                "enable": True,
                "location": "source",
                "flow_rate": 3,
                "params": {"foo": "bar"},
            }
        )
