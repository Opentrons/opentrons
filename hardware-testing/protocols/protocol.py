"""A protocol."""

from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "", "apiLevel": "2.12"}


def run(protocol: ProtocolContext) -> None:
    """Run the protocol."""
    protocol.comment("done.")
