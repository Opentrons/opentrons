"""Smoke Test v3.0 """
# https://opentrons.atlassian.net/projects/RQA?selectedItem=com.atlassian.plugins.atlassian-connect-plugin:com.kanoah.test-manager__main-project-page#!/testCase/QB-T497
from opentrons import protocol_api

metadata = {
    "protocolName": "🛠️ 2.17 Smoke Test",
    "author": "Opentrons Engineering <engineering@opentrons.com>",
    "source": "Software Testing Team",
    "description": ("Placeholder - 2.17 Smoke Test is the same a 2.16 Smoke Test."),
}

requirements = {"robotType": "OT-2", "apiLevel": "2.16"}


def run(ctx: protocol_api.ProtocolContext) -> None:
    """This method is run by the protocol engine."""
    # The only change in api version 2.17 is an error is thrown when you try to dispense more than the current volume of liquid in the pipette.

    # Since the smoke test protocol should be able to be ran through without any errors, the test for the dispense error should not be added to the smoke test protocol.

    # Instead it should be added to a separate test protocol - OT2_P300M_P20S_TC_HS_TM_2_17_dispense_changes.py

    # Therefore the 2.17 smoke test protocol is the same as the 2.16 smoke test protocol. Instead of copying and pasting the 2.16 smoke test protocol, we will noop this protocol and add a comment to explain the situation.

    pass
