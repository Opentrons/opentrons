"""Router for /robot/control endpoints."""
from datetime import datetime
from fastapi import APIRouter, status, Depends
from typing import Annotated, TYPE_CHECKING, Callable, Optional

from opentrons_shared_data.robot.types import RobotType
from opentrons_shared_data.robot.types import RobotTypeEnum
from robot_server.deck_configuration.fastapi_dependencies import (
    get_deck_configuration_store,
)
from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.hardware import get_robot_type

from robot_server.errors.error_responses import ErrorBody
from robot_server.errors.robot_errors import NotSupportedOnOT2
from robot_server.maintenance_runs.dependencies import get_maintenance_run_data_manager
from robot_server.maintenance_runs.maintenance_run_data_manager import (
    MaintenanceRunDataManager,
)
from robot_server.maintenance_runs.maintenance_run_models import MaintenanceRunCreate
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.json_api import (
    PydanticResponse,
    SimpleBody,
)
from robot_server.service.json_api.request import RequestModel
from robot_server.service.notifications.publisher_notifier import (
    get_pe_notify_publishers,
)

from .models import EstopStatusModel, DoorStatusModel, DoorState
from .estop_handler import EstopHandler
from robot_server.hardware import get_estop_handler, get_hardware
from opentrons.hardware_control import HardwareControlAPI
from opentrons.config import feature_flags as ff

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API  # noqa: F401

control_router = APIRouter()


async def _get_estop_status_response(
    estop_handler: EstopHandler,
) -> PydanticResponse[SimpleBody[EstopStatusModel]]:
    """Helper to generate the current Estop Status as a response model."""
    data = EstopStatusModel.construct(
        status=estop_handler.get_state(),
        leftEstopPhysicalStatus=estop_handler.get_left_physical_status(),
        rightEstopPhysicalStatus=estop_handler.get_right_physical_status(),
    )
    return await PydanticResponse.create(content=SimpleBody.construct(data=data))


@PydanticResponse.wrap_route(
    control_router.get,
    path="/robot/control/estopStatus",
    summary="Get connected estop status.",
    description="Get the current estop status of the robot, as well as a list of connected estops.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[EstopStatusModel]},
        status.HTTP_403_FORBIDDEN: {"model": ErrorBody[NotSupportedOnOT2]},
    },
)
async def get_estop_status(
    estop_handler: Annotated[EstopHandler, Depends(get_estop_handler)],
) -> PydanticResponse[SimpleBody[EstopStatusModel]]:
    """Return the current status of the estop."""
    return await _get_estop_status_response(estop_handler)


@PydanticResponse.wrap_route(
    control_router.put,
    path="/robot/control/acknowledgeEstopDisengage",
    summary="Acknowledge and clear an Estop event.",
    description="If the estop is currently logically engaged (the estop was previously pressed but is "
    + "now released), this endpoint will reset the state to reflect the current physical status.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[EstopStatusModel]},
        status.HTTP_403_FORBIDDEN: {"model": ErrorBody[NotSupportedOnOT2]},
    },
)
async def put_acknowledge_estop_disengage(
    estop_handler: Annotated[EstopHandler, Depends(get_estop_handler)],
    run_id: Annotated[str, Depends(get_unique_id)],
    created_at: Annotated[datetime, Depends(get_current_time)],
    run_data_manager: Annotated[
        MaintenanceRunDataManager, Depends(get_maintenance_run_data_manager)
    ],
    deck_configuration_store: Annotated[
        DeckConfigurationStore, Depends(get_deck_configuration_store)
    ],
    notify_publishers: Annotated[Callable[[], None], Depends(get_pe_notify_publishers)],
    request_body: Optional[RequestModel[MaintenanceRunCreate]] = None,
) -> PydanticResponse[SimpleBody[EstopStatusModel]]:
    """Transition from the `logically_engaged` status if applicable."""
    estop_handler.acknowledge_and_clear()
    # here, move the plate reader back into its deck slot

    # 1. check if the gripper has a plate reader lid?
    # 2. create a maintenence run
    # 3. load plate reader + lid
    # 4. move lid to dock

    offsets = request_body.data.labwareOffsets if request_body is not None else []
    deck_configuration = await deck_configuration_store.get_deck_configuration()

    run_data = await run_data_manager.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=offsets,
        deck_configuration=deck_configuration,
        notify_publishers=notify_publishers,
    )

    return await _get_estop_status_response(estop_handler)


def get_door_switch_required(
    robot_type: Annotated[RobotType, Depends(get_robot_type)]
) -> bool:
    return ff.enable_door_safety_switch(RobotTypeEnum.robot_literal_to_enum(robot_type))


@PydanticResponse.wrap_route(
    control_router.get,
    path="/robot/door/status",
    summary="Get the status of the robot door.",
    description="Get whether the robot door is open or closed.",
    responses={status.HTTP_200_OK: {"model": SimpleBody[DoorStatusModel]}},
)
async def get_door_status(
    hardware: Annotated[HardwareControlAPI, Depends(get_hardware)],
    door_required: Annotated[bool, Depends(get_door_switch_required)],
) -> PydanticResponse[SimpleBody[DoorStatusModel]]:
    return await PydanticResponse.create(
        content=SimpleBody.construct(
            data=DoorStatusModel.construct(
                status=DoorState.from_hw_physical_status(hardware.door_state),
                doorRequiredClosedForProtocol=door_required,
            )
        )
    )
