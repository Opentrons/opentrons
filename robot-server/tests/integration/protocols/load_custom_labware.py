from opentrons.protocol_api import ProtocolContext

metadata = {
    "protocolName": "custom",
    "author": "Opentrons <protocols@opentrons.com>",
    "apiLevel": "2.4",
}


def run(ctx: ProtocolContext) -> None:
    ctx.load_labware(
        load_name="test_1_reservoir_5ul",
        location=1,
        namespace="custom_beta",
        label="custom1",
        version=1,
    )
