from opentrons import protocol_api

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}

metadata = {
    "protocolName": "Thermocycler ramp rate",
    "author": "QA",
    "description": "start_set_block_temperature + set_block_temperature ramp_rate.",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    tc_mod = protocol.load_module("thermocyclerModuleV2")

    if tc_mod.lid_position != "open":
        tc_mod.open_lid()

    protocol.comment("Pre-heating TC to 80°C...")
    tc_mod.start_set_block_temperature(
        temperature=80,
        block_max_volume=100,
        ramp_rate=1,
    )

    protocol.delay(seconds=10, msg="Simulating work while TC heats up")

    protocol.comment("Cooling TC to 4°C and waiting for completion...")
    tc_mod.set_block_temperature(
        temperature=95,
        ramp_rate=4.25,
    )

    tc_mod.set_block_temperature(
        temperature=80,
        ramp_rate=0.5,
    )

    tc_mod.deactivate_block()
    tc_mod.open_lid()
