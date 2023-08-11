metadata = {
    "protocolName": "Deck Coordinate PAPIv2 Test",
}

requirements = {"apiLevel": "2.15"}


def run(context):
    labware = context.load_labware("opentrons_96_tiprack_1000ul", "3")
    assert labware.parent == "3"

    module = context.load_module("heaterShakerModuleV1", "1")
    assert module.parent == "1"

    context.move_labware(labware=labware, new_location=2)
