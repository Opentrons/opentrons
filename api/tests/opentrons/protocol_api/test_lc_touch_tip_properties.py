"""Tests for delay properties in the Opentrons protocol API."""

from typing import Any, Union

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from pydantic import ValidationError

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    LiquidClassTouchTipParams,
    TouchTipProperties,
)

from . import (
    boolean_looking_values,
    invalid_values,
    negative_or_zero_floats_and_ints,
    positive_non_zero_floats_and_ints,
    reasonable_numbers,
)
from opentrons.protocol_api._liquid_properties import _build_touch_tip_properties


def test_touch_tip_properties_enable_and_disable() -> None:
    """Test enabling and disabling TouchTipProperties."""
    tp = _build_touch_tip_properties(
        TouchTipProperties(
            enable=False,
            params=LiquidClassTouchTipParams(zOffset=1, mmFromEdge=1, speed=100),
        )
    )
    tp.enabled = True
    assert tp.enabled is True
    tp.enabled = False
    assert tp.enabled is False


def test_touch_tip_properties_none_instantiation_combos() -> None:
    """Test handling of None combinations in TouchTipProperties instantiation."""
    with pytest.raises(ValidationError):
        _build_touch_tip_properties(
            TouchTipProperties(
                enable=True,
                params=LiquidClassTouchTipParams(
                    zOffset=None,  # type: ignore
                    mmFromEdge=None,  # type: ignore
                    speed=None,  # type: ignore
                ),
            )
        )
    with pytest.raises(ValidationError):
        _build_touch_tip_properties(
            TouchTipProperties(
                enable=None,  # type: ignore
                params=LiquidClassTouchTipParams(zOffset=None, mmFromEdge=1, speed=1),  # type: ignore
            )
        )
    with pytest.raises(ValidationError):
        _build_touch_tip_properties(
            TouchTipProperties(
                enable=True,
                params=LiquidClassTouchTipParams(zOffset=1, mmFromEdge=None, speed=1),  # type: ignore
            )
        )
    with pytest.raises(ValidationError):
        _build_touch_tip_properties(
            TouchTipProperties(
                enable=True,
                params=LiquidClassTouchTipParams(zOffset=1, mmFromEdge=1, speed=None),  # type: ignore
            )
        )


@given(bad_value=st.one_of(invalid_values, boolean_looking_values))
@settings(deadline=None, max_examples=50)
def test_touch_tip_properties_enabled_bad_values(bad_value: Any) -> None:
    """Test bad values for TouchTipProperties.enabled."""
    with pytest.raises(ValidationError):
        _build_touch_tip_properties(
            TouchTipProperties(
                enable=bad_value,
                params=LiquidClassTouchTipParams(zOffset=1, mmFromEdge=1, speed=1),
            )
        )
    tp = _build_touch_tip_properties(
        TouchTipProperties(
            enable=False,
            params=LiquidClassTouchTipParams(zOffset=1, mmFromEdge=1, speed=1),
        )
    )
    with pytest.raises(ValueError):
        tp.enabled = bad_value


@given(good_value=reasonable_numbers)
@settings(deadline=None, max_examples=50)
def test_touch_tip_properties_z_offset(good_value: Union[int, float]) -> None:
    """Test valid z_offset."""
    _build_touch_tip_properties(
        TouchTipProperties(
            enable=True,
            params=LiquidClassTouchTipParams(
                zOffset=good_value, mmFromEdge=1, speed=10
            ),
        )
    )
    tp = _build_touch_tip_properties(
        TouchTipProperties(
            enable=False,
            params=LiquidClassTouchTipParams(zOffset=0, mmFromEdge=1, speed=10),
        )
    )
    tp.z_offset = good_value
    assert tp.z_offset == float(good_value)


@given(bad_value=invalid_values)
@settings(deadline=None, max_examples=50)
def test_touch_tip_properties_z_offset_bad_values(bad_value: Any) -> None:
    """Test invalid z_offset values."""
    with pytest.raises(ValidationError):
        _build_touch_tip_properties(
            TouchTipProperties(
                enable=True,
                params=LiquidClassTouchTipParams(
                    zOffset=bad_value, mmFromEdge=1, speed=10
                ),
            )
        )
    tp = _build_touch_tip_properties(
        TouchTipProperties(
            enable=False,
            params=LiquidClassTouchTipParams(zOffset=0, mmFromEdge=1, speed=10),
        )
    )
    with pytest.raises(ValueError):
        tp.z_offset = bad_value


@given(good_value=reasonable_numbers)
@settings(deadline=None, max_examples=50)
def test_touch_tip_properties_mm_from_edge(good_value: Union[int, float]) -> None:
    """Test valid mm_from_edge."""
    _build_touch_tip_properties(
        TouchTipProperties(
            enable=True,
            params=LiquidClassTouchTipParams(
                zOffset=0, mmFromEdge=good_value, speed=10
            ),
        )
    )
    tp = _build_touch_tip_properties(
        TouchTipProperties(
            enable=False,
            params=LiquidClassTouchTipParams(zOffset=0, mmFromEdge=1, speed=10),
        )
    )
    tp.mm_from_edge = good_value
    assert tp.mm_from_edge == float(good_value)


@given(bad_value=invalid_values)
@settings(deadline=None, max_examples=50)
def test_touch_tip_properties_mm_from_edge_bad_values(bad_value: Any) -> None:
    """Test invalid mm_from_edge values."""
    with pytest.raises(ValidationError):
        _build_touch_tip_properties(
            TouchTipProperties(
                enable=True,
                params=LiquidClassTouchTipParams(
                    zOffset=bad_value, mmFromEdge=1, speed=10
                ),
            )
        )
    tp = _build_touch_tip_properties(
        TouchTipProperties(
            enable=True,
            params=LiquidClassTouchTipParams(zOffset=0, mmFromEdge=1, speed=10),
        )
    )
    with pytest.raises(ValueError):
        tp.mm_from_edge = bad_value


@given(good_value=positive_non_zero_floats_and_ints)
@settings(deadline=None, max_examples=50)
def test_touch_tip_properties_speed(good_value: Union[int, float]) -> None:
    """Test valid speed."""
    _build_touch_tip_properties(
        TouchTipProperties(
            enable=True,
            params=LiquidClassTouchTipParams(zOffset=0, mmFromEdge=1, speed=good_value),
        )
    )
    tp = _build_touch_tip_properties(
        TouchTipProperties(
            enable=False,
            params=LiquidClassTouchTipParams(zOffset=0, mmFromEdge=1, speed=10),
        )
    )
    tp.speed = good_value
    assert tp.speed == float(good_value)


@given(bad_value=st.one_of(invalid_values, negative_or_zero_floats_and_ints))
@settings(deadline=None, max_examples=50)
def test_touch_tip_properties_speed_bad_values(bad_value: Any) -> None:
    """Test invalid speed values."""
    with pytest.raises(ValidationError):
        _build_touch_tip_properties(
            TouchTipProperties(
                enable=True,
                params=LiquidClassTouchTipParams(
                    zOffset=0, mmFromEdge=1, speed=bad_value
                ),
            )
        )
    tp = _build_touch_tip_properties(
        TouchTipProperties(
            enable=False,
            params=LiquidClassTouchTipParams(zOffset=0, mmFromEdge=1, speed=10),
        )
    )
    with pytest.raises(ValueError):
        tp.speed = bad_value
