from opentrons import protocol_api

metadata = {
    "protocolName": "Testosaur with RTP",
    "author": "Opentrons <engineering@opentrons.com>",
    "description": 'A variant on "Dinosaur" for testing with Run time parameters',
    "source": "Opentrons Repository",
    "apiLevel": "2.18",
}


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    parameters.add_int(
        display_name="Sample count",
        variable_name="sample_count",
        default=3,
        minimum=1,
        maximum=6,
        description="How many samples to process.",
    )
    parameters.add_str(
        display_name="Mount",
        variable_name="mount",
        choices=[
            {"display_name": "Left Mount", "value": "left"},
            {"display_name": "Right Mount", "value": "right"},
        ],
        default="left",
        description="What mount to use.",
    )


def run(ctx: protocol_api.ProtocolContext) -> None:
    tip_rack = ctx.load_labware("opentrons_96_tiprack_300ul", 8)
    source = ctx.load_labware("nest_12_reservoir_15ml", 1)
    dest = ctx.load_labware("corning_96_wellplate_360ul_flat", 2)

    pipette = ctx.load_instrument("p300_single_gen2", ctx.params.mount, [tip_rack])  # type: ignore[attr-defined]

    for i in range(ctx.params.sample_count):  # type: ignore[attr-defined]
        pipette.pick_up_tip()
        pipette.aspirate(50, source.wells_by_name()["A1"])
        pipette.dispense(50, dest.wells()[i])
        pipette.return_tip()
