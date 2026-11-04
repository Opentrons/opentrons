"""Test the InstrumentContext class and its functions"""

from typing import Any, Dict
from unittest import mock

import pytest

import opentrons.protocol_api as papi
from opentrons.hardware_control import ThreadManagedHardware
from opentrons.protocols.advanced_control.transfers import transfer as v1_transfer


@pytest.fixture
def context_and_labware(
    hardware: ThreadManagedHardware,
    deck_definition_name: str,
    ctx: papi.ProtocolContext,
) -> Dict[str, Any]:
    tr = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2")
    lw1 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", "A1")
    instr = ctx.load_instrument("flex_1channel_1000", "right", tip_racks=[tr])
    return {"ctx": ctx, "instr": instr, "lw1": lw1}


@pytest.mark.parametrize(
    argnames="liquid_handling_command,blowout_location,expected_error_match,",
    argvalues=[
        ["transfer", "some invalid location", "blowout location should be either"],
        [
            "consolidate",
            "source well",
            "blowout location for consolidate cannot be source well",
        ],
        [
            "distribute",
            "destination well",
            "blowout location for distribute cannot be destination well",
        ],
    ],
)
def test_blowout_location_invalid(
    context_and_labware: dict[str, Any],
    liquid_handling_command: str,
    blowout_location: str,
    expected_error_match: str,
) -> None:
    context_and_labware["ctx"].home()
    lw1 = context_and_labware["lw1"]
    instr = context_and_labware["instr"]
    with pytest.raises(ValueError, match=expected_error_match):
        getattr(instr, liquid_handling_command)(
            100, lw1["A1"], lw1["A2"], blowout_location=blowout_location
        )


@pytest.mark.parametrize(
    argnames="liquid_handling_command,blowout_location,expected_strat,",
    argvalues=[
        ["transfer", "destination well", v1_transfer.BlowOutStrategy.DEST],
        ["transfer", "source well", v1_transfer.BlowOutStrategy.SOURCE],
        ["transfer", "trash", v1_transfer.BlowOutStrategy.TRASH],
        ["consolidate", "destination well", v1_transfer.BlowOutStrategy.DEST],
        ["consolidate", "trash", v1_transfer.BlowOutStrategy.TRASH],
        ["distribute", "source well", v1_transfer.BlowOutStrategy.SOURCE],
        ["distribute", "trash", v1_transfer.BlowOutStrategy.TRASH],
    ],
)
def test_valid_blowout_location(
    context_and_labware: dict[str, Any],
    liquid_handling_command: str,
    blowout_location: str,
    expected_strat: str,
) -> None:
    context_and_labware["ctx"].home()
    lw1 = context_and_labware["lw1"]
    instr = context_and_labware["instr"]
    instr.pick_up_tip()
    with mock.patch.object(papi.InstrumentContext, "_execute_transfer") as patch:
        getattr(instr, liquid_handling_command)(
            100,
            lw1["A2"],
            [lw1["A1"], lw1["B1"]],
            blow_out=True,
            blowout_location=blowout_location,
            new_tip="never",
        )
        blowout_strat = patch.call_args[0][0]._options.transfer.blow_out_strategy

        assert blowout_strat == expected_strat
