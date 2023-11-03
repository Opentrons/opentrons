"""The HTTP API for getting and setting the robot's current deck configuration."""


from datetime import datetime

import fastapi
from robot_server.deck_configuration.fastapi_dependencies import (
    get_deck_configuration_store,
)

from robot_server.service.dependencies import get_current_time
from robot_server.service.json_api import PydanticResponse, RequestModel, SimpleBody
from . import models
from .store import DeckConfigurationStore


router = fastapi.APIRouter()


# TODO: Elaborate on what "the deck configuration" is, conceptually
@router.put(
    "/deck_configuration",
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
    },
)
async def put_deck_configuration(  # noqa: D103
    request_body: RequestModel[models.DeckConfigurationRequest],
    store: DeckConfigurationStore = fastapi.Depends(get_deck_configuration_store),
    last_updated_at: datetime = fastapi.Depends(get_current_time),
) -> PydanticResponse[SimpleBody[models.DeckConfigurationResponse]]:
    response = await store.set(request_body.data, last_updated_at)
    return await PydanticResponse.create(content=SimpleBody.construct(data=response))


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
