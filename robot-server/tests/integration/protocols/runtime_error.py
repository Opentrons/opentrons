from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.6"}


def run(ctx: ProtocolContext) -> None:
    ctx.you_will_fail()  # type: ignore[attr-defined]
