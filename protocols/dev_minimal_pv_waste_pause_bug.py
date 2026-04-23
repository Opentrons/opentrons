"""
Minimal protocol to trigger protocol visualization bug (waste 1-well + pause).

Uses a module-level Location for waste dispense (assigned inside run), similar to
protocols that stash `waste = load_labware(...).wells()[0].top()` at module scope
or in globals — analysis may attach metadata differently than inline `waste["A1"].top()`.

Repro: PV — select pause step; open liquid waste labware panel on C3.

See: LabwareSlotContainer selectedWellName without labwareDef.wells guard.
"""

from opentrons import protocol_api

metadata = {
    "protocolName": "dev — minimal PV waste + pause bug",
    "author": "opentrons",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}

# Set in run(); dispense targets this Location before pause (no air_gap).
DISPENSE_LOCATION = None


def run(ctx: protocol_api.ProtocolContext) -> None:
    global DISPENSE_LOCATION

    sample = ctx.load_labware("nest_96_wellplate_2ml_deep", "D1", "Samples")
    waste_labware = ctx.load_labware("nest_1_reservoir_290ml", "C3", "Waste")
    DISPENSE_LOCATION = waste_labware.wells()[0].top()
    tips = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1")

    pip = ctx.load_instrument("flex_8channel_1000", "left")

    pip.pick_up_tip(tips["A1"])
    pip.aspirate(50, sample["A5"])
    pip.dispense(pip.current_volume, DISPENSE_LOCATION)
    ctx.pause(msg="Open waste labware in PV while this pause step is selected.")
