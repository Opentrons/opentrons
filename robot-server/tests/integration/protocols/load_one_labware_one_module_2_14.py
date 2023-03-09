# Make sure apiLevel is high enough that this protocol will be run through Protocol Engine.
metadata = {
    "apiLevel": "2.14",
}


def run(protocol):
    protocol.load_labware("biorad_96_wellplate_200ul_pcr", 1)
    protocol.load_module("heaterShakerModuleV1", 3)
