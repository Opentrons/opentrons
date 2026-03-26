# mypy: ignore-errors
from opentrons import protocol_api

metadata = {"protocolName": "Simple Flex Comment Smoke"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    protocol.comment("simple flex robot http smoke")
