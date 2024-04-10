from opentrons.protocol_api import ProtocolContext, ParameterContext

metadata = {
    "apiLevel": "2.18",
    "author": "engineer@opentrons.com",
    "protocolName": "basic_transfer_standalone",
}


def add_parameters(parameters: ParameterContext):
    parameters.add_int(
        display_name="Sample count",
        variable_name="sample_count",
        default=6,
        minimum=1,
        maximum=12,
        description="How many samples to process.",
    )
    parameters.add_float(
        display_name="Pipette volume",
        variable_name="volume",
        default=20.1,
        choices=[
            {"display_name": "Low Volume", "value": 10.23},
            {"display_name": "Medium Volume", "value": 20.1},
            {"display_name": "High Volume", "value": 50.5},
        ],
        description="How many microliters to pipette of each sample.",
        unit="µL",  # Unit is not wired up, and it doesn't raise errors either.
    )
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="dry_run",
        default=False,
        description="Skip aspirate and dispense steps.",
    )
    parameters.add_str(
        display_name="Pipette Name",
        variable_name="pipette",
        choices=[
            {"display_name": "Single channel 50µL", "value": "flex_1channel_50"},
            {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
        ],
        default="flex_1channel_50",
        description="What pipette to use during the protocol.",
    )


def run(protocol: ProtocolContext) -> None:
    plate = protocol.load_labware("corning_96_wellplate_360ul_flat", 1)
    tiprack_1 = protocol.load_labware("opentrons_96_tiprack_300ul", 2)
    p300 = protocol.load_instrument("p300_single", "right", tip_racks=[tiprack_1])

    p300.pick_up_tip()
    p300.aspirate(100, plate["A1"])
    p300.dispense(100, plate["B1"])
    p300.return_tip()
