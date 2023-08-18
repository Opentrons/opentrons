metadata = {
    "protocolName": "Deck Coordinate PAPIv2 Test",
}

requirements = {"robotType": "Flex", "apiLevel": "2.15"}


def run(context):
    pipette = context.load_instrument("p1000_single_gen2", mount="left")

    labware = context.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "d3")
    assert labware.parent == "D3"

    module = context.load_module("temperatureModuleV2", "A1")
    assert module.parent == "A1"

    pipette.move_to(labware.wells()[0].top())
    module_labware = module.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt")

    pipette.move_to(module_labware.wells()[0].top())
