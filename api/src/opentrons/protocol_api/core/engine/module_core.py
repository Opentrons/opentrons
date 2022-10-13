"""Protocol API module implementation logic."""
from ..labware import LabwareCoreType
from ..module import AbstractModuleCore
from .labware import LabwareCore

from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.protocol_engine.types import ModuleLocation


class ModuleCore(AbstractModuleCore[LabwareCore]):
    """Module core logic implementation for Python protocols.

    Args:
        module_id: ProtocolEngine ID of the loaded modules.
    """

    def __init__(self, module_id: str, engine_client: ProtocolEngineClient) -> None:
        self._module_id = module_id
        self._engine_client = engine_client

        # modules_state = engine_client.state.modules

    @property
    def module_id(self) -> str:
        """The module's unique ProtocolEngine ID."""
        return self._module_id

    def add_labware_core(self, labware_core: LabwareCoreType) -> None:
        """ "Add labware on a giving module."""
        labware_params = labware_core.get_load_params()
        moduleLocation = ModuleLocation(moduleId=self.module_id)
        self._engine_client.load_labware(
            location=moduleLocation,
            load_name=labware_params.load_name,
            namespace=labware_params.namespace,
            version=labware_params.version,
        )
