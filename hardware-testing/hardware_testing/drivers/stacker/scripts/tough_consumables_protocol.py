from opentrons.protocol_api import (
    ProtocolContext, 
    ParameterContext
)
# metadata
metadata = {"protocolName": "Tough Consumables Protocol"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_str(
        display_name="Target Labware",
        variable_name="labware_name",
        description="The labware that needs to be tested.",
        default="opentrons_tough_1_reservoir_300ml",
        choices=[
            {
                "display_name": "OT 1 Well  Reservoir 300ml",
                "value": "opentrons_tough_1_reservoir_300ml",
            },
            {
                "display_name": "OT 4 reservoir 72ml",
                "value": "opentrons_tough_4_reservoir_72ml",
            },
            {
                "display_name": "OT 12 Reservoir 22ml",
                "value": "opentrons_tough_12_reservoir_22ml",
            },
            {
                "display_name": "OT Universal Lid",
                "value": "opentrons_tough_universal_lid",
            },
        ],
    )
    parameters.add_int(
        display_name="Cycles",
        variable_name="test_cycles",
        description="The number of cycles of dispensing/storing to perform.",
        default=1,
        minimum=1,
        maximum=10,
    )

def run(protocol: ProtocolContext):
    labware_name = protocol.params.labware_name
    trash = protocol.load_trash_bin("A3")   # or "B3"-"D3" if those slots are free
    # Load adapter 
    adapter = protocol.load_adapter(
        load_name='opentrons_flex_96_tiprack_adapter',
        location='B2'
    )

    # Load tiprack on the adapter
    tiprack = adapter.load_labware('opentrons_flex_96_tiprack_1000ul')

    # Load the labware
    reservoir = protocol.load_labware(
        load_name=labware_name,  # or your custom labware name
        location='C2'
    )

    # Load the 96-channel pipette
    pipette_96 = protocol.load_instrument(
        instrument_name='flex_96channel_1000',
        mount='left'
    )

    # Load gripper (automatically handled in Flex API)

    # Use the gripper to move the reservoir from C2 to B2
    protocol.move_labware(
        labware=reservoir,
        new_location='D2',
        use_gripper=True,
        pick_up_offset={"x": 0, "y": 0, "z": 0},
        drop_offset = {"x": 0, "y": 0, "z": 0}
        )

    protocol.comment("Reservoir moved from C2 to B2 using the gripper.")

    # Pick up tips (assumes tips are loaded in A1)
    # tiprack = protocol.load_labware('opentrons_flex_96_tiprack_1000ul', location='A1')
    pipette_96.pick_up_tip(tiprack['A1'])

    # Move to the reservoir and aspirate
    pipette_96.move_to(reservoir.wells()[0].top())
    protocol.pause("Please check the tip position before continuing.")
    pipette_96.move_to(reservoir.wells()[0].bottom(5))
    protocol.pause("Please check the clearance before continuing.")

    pipette_96.return_tip()

    protocol.comment("Protocol complete.")
