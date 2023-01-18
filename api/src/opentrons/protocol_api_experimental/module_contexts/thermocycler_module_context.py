"""Protocol API interfaces for Thermocycler Modules."""
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient


class ThermocyclerModuleContext:  # noqa: D101
    # TODO(mc, 2022-02-09): copy or rewrite docstring from
    # src/opentrons/protocol_api/module_contexts.py

    def __init__(self, engine_client: ProtocolEngineClient, module_id: str) -> None:
        self._engine_client = engine_client
        self._module_id = module_id

    def __eq__(self, other: object) -> bool:
        """Compare for object equality using identifier string."""
        return (
            isinstance(other, ThermocyclerModuleContext)
            and self._module_id == other._module_id
        )

    def deactivate_lid(self) -> None:
        """Turn off the lid heater."""
        self._engine_client.thermocycler_deactivate_lid(self._module_id)

    def deactivate_block(self) -> None:
        """Turn off the well block heater."""
        self._engine_client.thermocycler_deactivate_block(self._module_id)

    def open_lid(self) -> None:
        """Opens a thermocycler's lid."""
        self._engine_client.thermocycler_open_lid(self._module_id)

    def close_lid(self) -> None:
        """Closes a thermocycler's lid."""
        self._engine_client.thermocycler_close_lid(self._module_id)

    # TODO(mc, 2022-04-29): if you go down to the driver level, there is a
    # separate "deactivate all" g-code. Is this functionally different than
    # deactivating the lid and block in sequence like this?
    def deactivate(self) -> None:
        """Turn off all heaters."""
        self.deactivate_lid()
        self.deactivate_block()
