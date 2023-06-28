"""Get the default protocol engine."""
from typing_extensions import Literal

from fastapi import Depends, status

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine import ProtocolEngine

from opentrons_shared_data.errors import ErrorCodes

from robot_server.errors import ErrorDetails
from robot_server.hardware import get_hardware
from robot_server.runs import EngineStore, EngineConflictError, get_engine_store
from robot_server.modules import ModuleIdentifier


class RunActive(ErrorDetails):
    """An error returned if there is a run active.

    If there is a run active, you cannot issue stateless commands.
    """

    id: Literal["RunActive"] = "RunActive"
    title: str = "Run Active"
    detail: str = (
        "There is an active run. Close the current run"
        " to issue commands via POST /commands."
    )
    errorCode: str = ErrorCodes.ROBOT_IN_USE.value.code


async def get_default_engine(
    engine_store: EngineStore = Depends(get_engine_store),
    hardware_api: HardwareControlAPI = Depends(get_hardware),
    module_identifier: ModuleIdentifier = Depends(ModuleIdentifier),
) -> ProtocolEngine:
    """Get the default engine with attached modules loaded."""
    try:
        engine = await engine_store.get_default_engine()
    except EngineConflictError as e:
        raise RunActive.from_exc(e).as_error(status.HTTP_409_CONFLICT) from e

    attached_modules = hardware_api.attached_modules
    attached_module_spec = {
        module_identifier.identify(mod.device_info).module_id: mod
        for mod in attached_modules
    }

    await engine.use_attached_modules(attached_module_spec)

    return engine
