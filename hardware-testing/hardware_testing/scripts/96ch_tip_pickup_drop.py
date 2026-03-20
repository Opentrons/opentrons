"""96-channel pipette tip pickup and drop protocol."""

from opentrons.protocol_api import ProtocolContext, ParameterContext

metadata = {"protocolName": "pickup_and_drop_tips v1.0"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}
def add_parameters(parameters: ParameterContext) -> None:
    """Add protocol parameters."""
    parameters.add_int(
        display_name="Cycle Count",
        variable_name="cycle_count",
        default=15000,
        minimum=1,
        maximum=100000,
        description="Number of tip pickup and drop cycles to perform"
    )

def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    # Get cycle count from parameters
    cycle_count = ctx.params.cycle_count
    # For OT-3/Flex
    # Load Flex tip rack
    adapter = ctx.load_adapter(
        "opentrons_flex_96_tiprack_adapter",
        "D2"
    )

    tiprack = adapter.load_labware(
        "opentrons_flex_96_tiprack_200ul"
    )

    pipette = ctx.load_instrument(
        "flex_96channel_200",  # 200ul 96-channel pipette for Flex
        "left",  # Mount on left side
        tip_racks=[tiprack]
    )
    # Set pipette speed
    #pipette.default_speed = 400

    # Start cycle
    ctx.comment(f"Starting {cycle_count} tip pickup and return cycles...")
    # Determine robot type and load appropriate pipette

    # 👉 固定使用 A1（96ch 实际是整板对齐）
    tip = tiprack.wells()[0]

    simulating = ctx.is_simulating()
    if not simulating:
        
            for i in range(cycle_count):
                try:
                    if i % 50 == 0:
                        ctx.comment(f"Cycle {i}/{cycle_count}")
                    if i % 500 == 0:
                        ctx.comment("Reset position")
                        pipette.home()
                    # Pick up tip
                    pipette.pick_up_tip(tip)
                    # Return tip to tiprack
                    pipette.return_tip()
                except Exception as e:
                    ctx.comment(f"Error at cycle {i}: {e}")
                    pipette.home()
                    continue
            
    else:
            pipette.pick_up_tip(tip)
            # Return tip to tiprack
            pipette.return_tip()
    ctx.comment(f"Completed {cycle_count} tip pickup and return cycles.")
