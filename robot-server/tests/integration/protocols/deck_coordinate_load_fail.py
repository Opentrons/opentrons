metadata = {
    "protocolName": "Deck Coordinate PAPIv2 Test",
}

requirements = {"robotType": "Flex", "apiLevel": "2.15"}


def run(context):
    labware = context.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "d3")
    assert labware.parent == "D3"

    thermocycler = context.load_module("thermocyclerModuleV2")
    assert thermocycler.parent == "B1"

    # This should fail because the Thermocycler is in the way.
    module = context.load_module("temperatureModuleV2", "A1")
    assert module.parent == "A1"
