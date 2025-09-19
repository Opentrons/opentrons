from opentrons.protocol_api import ProtocolContext

metadata = {
    "protocolName": "stop while waiting test",
    "author": "Opentrons <protocols@opentrons.com>",
    "apiLevel": "2.15",
}


def run(ctx: ProtocolContext) -> None:
    ctx.home()
    ctx.delay(seconds=30)
    ctx.set_rail_lights(on=True)
