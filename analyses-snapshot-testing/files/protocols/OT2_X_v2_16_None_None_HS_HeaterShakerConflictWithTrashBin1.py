# Pulled from: https://github.com/Opentrons/opentrons/pull/14475

metadata = {
    "protocolName": "Heater-shaker conflict OT-2",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.16"}


def run(context):
    context.load_module("heaterShakerModuleV1", "11")
