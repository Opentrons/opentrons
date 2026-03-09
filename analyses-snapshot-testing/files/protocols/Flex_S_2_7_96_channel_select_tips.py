from opentrons import protocol_api

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.27"
}

metadata = {
    "protocolName": "Smart 96-Ch - Full 96 Mode",
    "author": "QA",
    "description": "Full 96 nozzle configuration using the Tip Rack Adapter on C2."
}

def run(protocol_context: protocol_api.ProtocolContext):
    # --- 1. Load Labware ---
    trash = protocol_context.load_trash_bin('A3')
    source_plate = protocol_context.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "C1")
    dest_plate = protocol_context.load_labware("corning_384_wellplate_112ul_flat", "B2")

    # --- 2. Load Instruments ---
    pipette_96_channel = protocol_context.load_instrument("flex_96channel_1000", "left")
    
    try:
        water = protocol_context.get_liquid_class('water')
    except:
        water = "water"

    # --- 3. Staging Area Setup ---
    rack_1000 = protocol_context.load_labware("opentrons_flex_96_filtertiprack_1000ul", "B4")
    rack_200 = protocol_context.load_labware("opentrons_flex_96_filtertiprack_200ul", "D4")

    # --- 4. Define the Adapter (Full 96 Requirement) ---
    active_adapter = protocol_context.load_adapter("opentrons_flex_96_tiprack_adapter", "C2")

    # --- EXECUTION ---

    # Step 1: Move 1000uL Rack to Adapter
    protocol_context.comment("--> Gripper: Moving 1000uL Rack to Adapter on C2")
    protocol_context.move_labware(labware=rack_1000, new_location=active_adapter, use_gripper=True)

    # Step 2: Full 96 Transfer (1000uL)
    protocol_context.comment("Pipette: Full 96 Transfer (1000uL)")
    pipette_96_channel.transfer_with_liquid_class(
        liquid_class=water,
        volume=50,
        source=source_plate['A1'],
        dest=dest_plate['A1'],
        new_tip='always',
        tips=rack_1000['A1'],
        group_wells=False
    )

    # Step 3: Trash Rack 1
    protocol_context.move_labware(labware=rack_1000, new_location=protocol_api.OFF_DECK, use_gripper=False)

    # Step 4: Move 200uL Rack to Adapter
    protocol_context.move_labware(labware=rack_200, new_location=active_adapter, use_gripper=True)

    # Step 5: Full 96 Transfer (200uL)
    pipette_96_channel.transfer_with_liquid_class(
        liquid_class=water,
        volume=20,
        source=source_plate['A1'],
        dest=dest_plate['A1'],
        new_tip='always',
        tips=rack_200['A1'],
        group_wells=False
    )

    protocol_context.comment("--- Protocol Complete ---")