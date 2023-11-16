"""The HTTP API for getting and setting the robot's current deck configuration."""


from datetime import datetime
from typing import Union

import fastapi
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4

from robot_server.errors import ErrorBody
from robot_server.hardware import get_deck_definition
from robot_server.service.dependencies import get_current_time
from robot_server.service.json_api import PydanticResponse, RequestModel, SimpleBody

from . import models
from . import validation
from . import validation_mapping
from .fastapi_dependencies import get_deck_configuration_store
from .store import DeckConfigurationStore


router = fastapi.APIRouter()


@router.put(
    path="/deck_configuration",
    summary="Set the deck configuration",
    description=(
        "Inform the robot how its deck is physically set up."
        "\n\n"
        "When you use the `/runs` and `/maintenance_runs` endpoints to command the robot to move,"
        " the robot will automatically dodge the obstacles that you declare here."
        "\n\n"
        "If a run command tries to do something that inherently conflicts with this deck"
        " configuration, such as loading a labware into a staging area slot that this deck"
        " configuration doesn't provide, the run command will fail with an error."
        "\n\n"
        "After you set the deck configuration, it will persist, even across reboots,"
        " until you set it to something else."
    ),
    responses={
        fastapi.status.HTTP_200_OK: {
            "model": SimpleBody[models.DeckConfigurationResponse]
        },
        fastapi.status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorBody[models.InvalidDeckConfiguration]
        },
    },
)
async def put_deck_configuration(  # noqa: D103
    request_body: RequestModel[models.DeckConfigurationRequest],
    store: DeckConfigurationStore = fastapi.Depends(get_deck_configuration_store),
    last_updated_at: datetime = fastapi.Depends(get_current_time),
    deck_definition: DeckDefinitionV4 = fastapi.Depends(get_deck_definition),
) -> PydanticResponse[
    Union[
        SimpleBody[models.DeckConfigurationResponse],
        ErrorBody[models.InvalidDeckConfiguration],
    ]
]:
    placements = validation_mapping.map_in(request_body.data)
    validation_errors = validation.get_configuration_errors(deck_definition, placements)
    if len(validation_errors) == 0:
        success_data = await store.set(request_body.data, last_updated_at)
        return await PydanticResponse.create(
            content=SimpleBody.construct(data=success_data)
        )
    else:
        error_data = validation_mapping.map_out(validation_errors)
        return await PydanticResponse.create(
            content=ErrorBody.construct(errors=error_data),
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
        )


@router.get(
    "/deck_configuration",
    summary="Get the deck configuration",
    description=(
        "Get the robot's current deck configuration."
        " See `PUT /deck_configuration` for background information."
    ),
    responses={
        fastapi.status.HTTP_200_OK: {
            "model": SimpleBody[models.DeckConfigurationResponse]
        },
    },
)
async def get_deck_configuration(  # noqa: D103
    store: DeckConfigurationStore = fastapi.Depends(get_deck_configuration_store),
) -> PydanticResponse[SimpleBody[models.DeckConfigurationResponse]]:
    return await PydanticResponse.create(
        content=SimpleBody.construct(data=await store.get())
    )
