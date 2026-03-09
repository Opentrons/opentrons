"""Partial tip configurations for tests."""

from contextlib import nullcontext as does_not_raise
from typing import Any, ContextManager, NamedTuple, Optional

import pytest

from opentrons.protocol_api._nozzle_layout import NozzleLayout
from opentrons.protocols.api_support.util import UnsupportedAPIError


class NozzleLayoutArgs(NamedTuple):
    """Arguments to use in `configure_nozzle_layout`."""

    style: NozzleLayout
    start: Optional[str]
    end: Optional[str]
    front_right: Optional[str]
    back_left: Optional[str]


class PipetteIndependentNozzleConfigSpec(NamedTuple):
    """Parametrization data for pipette-independent nozzle configs test."""

    nozzle_layout_args: NozzleLayoutArgs
    expected_raise: ContextManager[Any]


PIPETTE_INDEPENDENT_TEST_SPECS = [
    PipetteIndependentNozzleConfigSpec(
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.SINGLE,
            start=None,
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Cannot configure a nozzle layout of style SINGLE without a starting nozzle.",
        ),
    ),
    PipetteIndependentNozzleConfigSpec(
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.SINGLE,
            start="H1",
            end="B1",
            front_right=None,
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'end', 'front_right' and 'back_left' cannot be used with the SINGLE nozzle configuration.",
        ),
    ),
    PipetteIndependentNozzleConfigSpec(
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.SINGLE,
            start="H1",
            end=None,
            front_right="C1",
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'end', 'front_right' and 'back_left' cannot be used with the SINGLE nozzle configuration.",
        ),
    ),
    PipetteIndependentNozzleConfigSpec(
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.SINGLE,
            start="H1",
            end=None,
            front_right=None,
            back_left="C1",
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'end', 'front_right' and 'back_left' cannot be used with the SINGLE nozzle configuration.",
        ),
    ),
    PipetteIndependentNozzleConfigSpec(
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.SINGLE,
            start="A1",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_raise=does_not_raise(),
    ),
    PipetteIndependentNozzleConfigSpec(
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ALL,
            start="H1",
            end="G1",
            front_right="X1",
            back_left="Z1",
        ),
        expected_raise=does_not_raise(),  # Arguments are ignored
    ),
    PipetteIndependentNozzleConfigSpec(
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ALL,
            start=None,
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_raise=does_not_raise(),
    ),
    PipetteIndependentNozzleConfigSpec(
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.QUADRANT,
            start="H1",
            end="G1",
            front_right="X1",
            back_left="Z1",
        ),
        expected_raise=pytest.raises(UnsupportedAPIError),
    ),
]


class PipetteReliantNozzleConfigSpec(NamedTuple):
    """Test parametrization data."""

    pipette_channels: int
    nozzle_layout_args: NozzleLayoutArgs
    expected_raise: ContextManager[Any]


PIPETTE_RELIANT_TEST_SPECS = [
    PipetteReliantNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.COLUMN,
            start="A1",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="COLUMN configuration is only supported on 96-Channel pipettes.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.COLUMN,
            start="E1",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Starting nozzle specified is not one of \\['A1', 'H1', 'A12', 'H12'\\].",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.COLUMN,
            start="A1",
            end="B1",
            front_right=None,
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'end', 'front_right' and 'back_left' cannot be used with"
            " the COLUMN nozzle configuration.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.COLUMN,
            start="A1",
            end=None,
            front_right="A1",
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'end', 'front_right' and 'back_left' cannot be used with"
            " the COLUMN nozzle configuration.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.COLUMN,
            start="A1",
            end=None,
            front_right=None,
            back_left="B1",
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'end', 'front_right' and 'back_left' cannot be used with"
            " the COLUMN nozzle configuration.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.COLUMN,
            start="A1",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_raise=does_not_raise(),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ROW,
            start="H1",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="ROW configuration is only supported on 96-Channel pipettes.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ROW,
            start="B1",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Starting nozzle specified is not one of \\['A1', 'H1', 'A12', 'H12'\\].",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ROW,
            start="A1",
            end="B1",
            front_right=None,
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'end', 'front_right' and 'back_left' cannot be used with"
            " the ROW nozzle configuration.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ROW,
            start="A1",
            end=None,
            front_right="A1",
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'end', 'front_right' and 'back_left' cannot be used with"
            " the ROW nozzle configuration.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ROW,
            start="A1",
            end=None,
            front_right=None,
            back_left="B1",
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'end', 'front_right' and 'back_left' cannot be used with"
            " the ROW nozzle configuration.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ROW,
            start="H1",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_raise=does_not_raise(),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.PARTIAL_COLUMN,
            start="H1",
            end="G1",
            front_right=None,
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Partial column configuration is only supported on 8-Channel pipettes",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.PARTIAL_COLUMN,
            start="H1",
            end=None,
            front_right="H1",
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Partial column configurations require the 'end' parameter.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.PARTIAL_COLUMN,
            start="H1",
            end="G1",
            front_right="H1",
            back_left=None,
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'front_right' and 'back_left' cannot be used with the PARTIAL_COLUMN configuration.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.PARTIAL_COLUMN,
            start="H1",
            end="G1",
            front_right=None,
            back_left="H1",
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="Parameters 'front_right' and 'back_left' cannot be used with the PARTIAL_COLUMN configuration.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.PARTIAL_COLUMN,
            start="H1",
            end="A1",
            front_right=None,
            back_left="H1",
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="A partial column configuration with 'start'=H1 cannot have its 'end' parameter be in row A."
            " Use `ALL` configuration to utilize all nozzles.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.PARTIAL_COLUMN,
            start="A1",
            end="H1",
            front_right=None,
            back_left="H1",
        ),
        expected_raise=pytest.raises(
            ValueError,
            match="A partial column configuration with 'start'=A1 cannot have its 'end' parameter be in row H."
            " Use `ALL` configuration to utilize all nozzles.",
        ),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.PARTIAL_COLUMN,
            start="A1",
            end="G1",
            front_right=None,
            back_left=None,
        ),
        expected_raise=does_not_raise(),
    ),
    PipetteReliantNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.PARTIAL_COLUMN,
            start="H1",
            end="G1",
            front_right=None,
            back_left=None,
        ),
        expected_raise=does_not_raise(),
    ),
]


class ExpectedCoreArgs(NamedTuple):
    """The converted arguments expected to be passed to instrument core."""

    primary_nozzle: Optional[str]
    front_right_nozzle: Optional[str]
    back_left_nozzle: Optional[str]


class InstrumentCoreNozzleConfigSpec(NamedTuple):
    """Test parametrization data."""

    pipette_channels: int
    nozzle_layout_args: NozzleLayoutArgs
    expected_core_args: ExpectedCoreArgs


INSTRUMENT_CORE_NOZZLE_LAYOUT_TEST_SPECS = [
    InstrumentCoreNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.SINGLE,
            start="A1",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_core_args=ExpectedCoreArgs(
            primary_nozzle="A1",
            front_right_nozzle=None,
            back_left_nozzle=None,
        ),
    ),
    InstrumentCoreNozzleConfigSpec(
        pipette_channels=8,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.PARTIAL_COLUMN,
            start="A1",
            end="D1",
            front_right=None,
            back_left=None,
        ),
        expected_core_args=ExpectedCoreArgs(
            primary_nozzle="A1",
            front_right_nozzle="D1",
            back_left_nozzle="A1",
        ),
    ),
    InstrumentCoreNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.COLUMN,
            start="H1",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_core_args=ExpectedCoreArgs(
            primary_nozzle="H1",
            front_right_nozzle=None,
            back_left_nozzle=None,
        ),
    ),
    InstrumentCoreNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ROW,
            start="A12",
            end=None,
            front_right=None,
            back_left=None,
        ),
        expected_core_args=ExpectedCoreArgs(
            primary_nozzle="A12",
            front_right_nozzle=None,
            back_left_nozzle=None,
        ),
    ),
    InstrumentCoreNozzleConfigSpec(
        pipette_channels=96,
        nozzle_layout_args=NozzleLayoutArgs(
            style=NozzleLayout.ALL,
            start="A12",
            end=None,
            front_right="D3",
            back_left=None,
        ),
        expected_core_args=ExpectedCoreArgs(  # These args are eventually ignored
            primary_nozzle="A12",
            front_right_nozzle="D3",
            back_left_nozzle=None,
        ),
    ),
]
