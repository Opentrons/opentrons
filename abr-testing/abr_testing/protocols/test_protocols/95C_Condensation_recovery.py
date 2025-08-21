"""1 hour hold at 95C to clear thermocycler condensation."""
from opentrons import protocol_api
from opentrons.protocol_api.module_contexts import ThermocyclerContext

metadata = {
    "protocolName": "95C Condensation Recovery",
    "author": "Rich Roser - Opentrons",
    "description": """Runs 1 hour 95C drying step
    it works even if thermistors are already affected by condensation""",
    "created": "2025-08-12T17:11:23.544Z",
    "lastModified": "2025-08-12T17:12:58.385Z",
    "protocolDesigner": "8.5.0",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Run the protocol."""
    # Load Modules:
    thermocycler_module_1: ThermocyclerContext = protocol.load_module(
        "thermocyclerModuleV2", "B1"
    )  # type: ignore[assignment]

    # PROTOCOL STEPS

    # Step 1:
    thermocycler_module_1.open_lid()

    # Step 2:
    thermocycler_module_1.close_lid()
    thermocycler_module_1.set_lid_temperature(37)
    thermocycler_module_1.execute_profile(
        [
            {"temperature": 96, "hold_time_seconds": 15},
            {"temperature": 95, "hold_time_seconds": 15},
        ],
        120,
        block_max_volume=10,
    )
    thermocycler_module_1.open_lid()
    thermocycler_module_1.deactivate_block()
    thermocycler_module_1.deactivate_lid()
