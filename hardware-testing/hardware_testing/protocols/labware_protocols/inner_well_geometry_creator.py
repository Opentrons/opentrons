"""Inner Well Geometry Creator Protocol."""

from opentrons.protocol_api import ProtocolContext, ParameterContext



metadata = {
    "protocolName": "Inner Well Geometry Creator",
    "author": "ABR"
}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

def _read_dial_indicator(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    dial: Labware,
    front_channel: bool = False,
) -> float:
    target = dial["A1"].top()
    if front_channel:
        target = target.move(Point(y=9 * 7))
        if pipette.channels == 96:
            target = target.move(Point(x=9 * -11))
    pipette.move_to(target.move(Point(z=10)))
    pipette.move_to(target)
    ctx.delay(seconds=2)
    if ctx.is_simulating():
        return 0.0
    dial_port = DIAL_PORT.read()  # type: ignore[union-attr]
    pipette.move_to(target.move(Point(z=10)))
    return dial_port


def _store_dial_baseline(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    dial: Labware,
    front_channel: bool = False,
) -> None:
    global DIAL_POS_WITHOUT_TIP
    idx = 0 if not front_channel else 1
    if DIAL_POS_WITHOUT_TIP[idx] is not None:
        return
    DIAL_POS_WITHOUT_TIP[idx] = _read_dial_indicator(ctx, pipette, dial, front_channel)
    tag = f"DIAL-BASELINE-{idx}"
    _write_line_to_csv(ctx, [tag, str(DIAL_POS_WITHOUT_TIP[idx])])


def _get_tip_z_error(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    dial: Labware,
    front_channel: bool = False,
) -> float:
    idx = 0 if not front_channel else 1
    dial_baseline_for_this_channel = DIAL_POS_WITHOUT_TIP[idx]
    assert dial_baseline_for_this_channel is not None
    new_val = _read_dial_indicator(ctx, pipette, dial, front_channel)
    z_error = new_val - dial_baseline_for_this_channel
    # NOTE: dial-indicators are upside-down, so we need to flip the values
    return z_error * -1.0


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    from hardware_testing import protocols
    protocols.create_labware_parameters(parameters) 
    parameters.add_bool(
        display_name = "Quick Mode",
        variable_name = "quick_mode",
        description = "If true, dial indicator is not used and tips are reused."
    )   
    # deck slot

def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    # TODO: Load labware, load pipettes
    labware_type = ctx.parameters.labware_type # type: ignore[attr-defined]
    labware = ctx.load_labware(labware_type, deck_slot)
    src_reservoir = ctx.load_labware("nest_1_reservoir_290ml", "D1")
    max_volume = labware["A1"].max_volume
    # TODO: depending on the max volume will determine the tip size we will use for filling the plate
    # TODO: if reservoir is used, liq pipette is 8ch, else 1ch

    probing_pipette = ctx.load_instrument()
    liquid_pipette = ctx.load_instrument()

    # Load dial indicator and connect
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    if not ctx.is_simulating() and DIAL_PORT is None:
        from hardware_testing.data import create_file_name, create_run_id
        from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
            Mitutoyo_Digimatic_Indicator,
        )

        DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
        DIAL_PORT.connect()
        RUN_ID = create_run_id()
        FILE_NAME = create_file_name(
            metadata["protocolName"], RUN_ID, f"{liquid_pip_name}-{liquid_rack_name}"
        )
        _write_line_to_csv(ctx, [RUN_ID])
        _write_line_to_csv(ctx, [liquid_pip_name])
        _write_line_to_csv(ctx, [liquid_rack_name])
        _write_line_to_csv(ctx, [LABWARE])
        _write_line_to_csv(ctx, [fill_increment]) 

        _write_line_to_csv(ctx, ["depth", str(labware["A1"].depth)])
    
    _store_dial_baseline(ctx, probing_pipette, dial)
    probing_pipette.pick_up_tip()
    liquid_pipette.pick_up_tip()
    liquid_pipette.measure_liquid_height(src_reservoir["A1"])
    # TODO: determine the fill increment 
    steps = 20 #optimize later
    step_volume = max_volume / steps 
    for i in range(int(steps)):
        liquid_pipette.transfer(step_volume, source_well, labware["bottom_left"], return_tips=False, blow_out=False)
        probing_pipette. #probes -> height exported to csv with the volume it probed at. 
        
