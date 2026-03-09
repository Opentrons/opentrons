from opentrons import protocol_api

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.27"
}

metadata = {
    "protocolName": "Smart 96-Ch - Partial Mode (Single Nozzle)",
    "author": "QA",
    "description": "Partial nozzle configuration (H12) without adapter on C2."
}

def run(protocol_context: protocol_api.ProtocolContext):
    # --- 1. Load Labware ---
    trash = protocol_context.load_trash_bin('A3')
    source_plate = protocol_context.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "C1")
    dest_plate = protocol_context.load_labware("corning_384_wellplate_112ul_flat", "B2")

    # --- 2. Load Instruments ---
    pipette_96_channel = protocol_context.load_instrument("flex_96channel_1000", "left")
    
    # Configure Partial Nozzles (Single Tip H12)
    pipette_96_channel.configure_nozzle_layout(style=protocol_api.SINGLE, start="H12")

    try:
        water = protocol_context.get_liquid_class('water')
    except:
        water = "water"

    # --- 3. Staging Area Setup ---
    rack_1000 = protocol_context.load_labware("opentrons_flex_96_filtertiprack_1000ul", "B4")
    rack_200 = protocol_context.load_labware("opentrons_flex_96_filtertiprack_200ul", "D4")

    # --- EXECUTION ---

    # Step 1: Move 1000uL Rack directly to Deck Slot C2
    protocol_context.comment("--> Gripper: Moving 1000uL Rack to Slot C2 (No Adapter)")
    protocol_context.move_labware(labware=rack_1000, new_location="C2", use_gripper=True)

    # Step 2: Partial Transfer
    protocol_context.comment("Pipette: Single Tip Transfer (H12)")
    pipette_96_channel.transfer_with_liquid_class(
        liquid_class=water,
        volume=100,
        source=[source_plate['A1'], source_plate['H12']],
        dest=[dest_plate['A1'], dest_plate['P24']],
        new_tip='always',
        tips=[rack_1000['A1'], rack_1000['H12']],
        group_wells=False
    )

    # Step 3: Trash Rack 1
    protocol_context.move_labware(labware=rack_1000, new_location=protocol_api.OFF_DECK, use_gripper=False)

    # Step 4: Move 200uL Rack to Slot C2
    protocol_context.move_labware(labware=rack_200, new_location="C2", use_gripper=True)

    # Step 5: (Optional) Add 200uL partial logic here if needed
    protocol_context.comment("Partial mode sequence for 200uL rack complete.")

    protocol_context.comment("--- Protocol Complete ---")