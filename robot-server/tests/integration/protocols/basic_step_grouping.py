from opentrons.protocol_api import ProtocolContext

metadata = {
    "protocolName": "Basic Step Grouping",
}

requirements = {"robotType": "Flex", "apiLevel": "2.29"}


def run(protocol: ProtocolContext) -> None:
    protocol.comment("This is not in a step group.")

    with protocol.group_steps(
        "My step group", description="It's a comment, that's it."
    ):
        protocol.comment("This will have a command annotation ID.")

    protocol.comment("This is also not in a step group.")

    step_group = protocol.create_and_start_step_group(
        "My step group 2", description="Another comment!"
    )
    protocol.comment("This will have a command annotation ID as well.")
    step_group.end_group()

    protocol.comment("This is also also not in a step group.")
