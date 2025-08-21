"""2 hour hold at 75C to clear thermocycler condensation."""
from opentrons import protocol_api
from opentrons.protocol_api.module_contexts import ThermocyclerContext

metadata = {
    "protocolName": "75C Condensation recovery",
    "author": "Rich Roser - Opentrons",
    "description": """2 hour hold at 75C to clear formed condensation from the unit
    it works even if thermistors are already affected.""",
    "created": "2025-08-12T17:07:49.478Z",
    "lastModified": "2025-08-12T17:09:57.306Z",
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
            {"temperature": 75, "hold_time_seconds": 15},
        ],
        480,
        block_max_volume=10,
    )
    thermocycler_module_1.deactivate_block()
    thermocycler_module_1.deactivate_lid()
