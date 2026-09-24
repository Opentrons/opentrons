from opentrons.protocol_api import ProtocolContext

metadata = {
    "protocolName": "Test Protocol",
    "author": "Raghav Mehta <raghav.mehta@opentrons.com>",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}

COMMENT_COUNT = 70000


def run(protocol: ProtocolContext) -> None:
    if not protocol.is_simulating():
        for i in range(1, COMMENT_COUNT):
            protocol.comment(f"this is step {i}")
