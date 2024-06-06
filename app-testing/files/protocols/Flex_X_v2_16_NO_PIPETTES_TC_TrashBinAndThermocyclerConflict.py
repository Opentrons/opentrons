# Pulled from: https://github.com/Opentrons/opentrons/pull/14475


metadata = {
    "protocolName": "Thermocycler conflict 1",
}

requirements = {"robotType": "Flex", "apiLevel": "2.16"}


def run(context):
    thermocycler = context.load_module("thermocyclerModuleV2")
    trash = context.load_trash_bin("A1")
