"""Endpoint functions for the `/clientData` endpoints."""

import textwrap
import fastapi

from robot_server.client_data.store import (
    ClientData,
    ClientDataStore,
    get_client_data_store,
)
from robot_server.service.json_api.request import RequestModel
from robot_server.service.json_api.response import SimpleBody

router = fastapi.APIRouter()


@router.put(
    path="/clientData",
    summary="Store client-defined data",
    description=textwrap.dedent(
        """\
        Store a small amount of arbitrary client-defined data.

        This endpoint is experimental and may be changed or removed without warning.

        This is intended to help coordinate between multiple clients accessing the same
        robot, and to help clients pick up from where they left off if they're closed
        and reopened. For example, suppose your client shows a user interface for
        physically setting up the deck with labware, step by step. You could use this
        to store which step the user is currently on.

        The data is stored as a single shared JSON object. Each `PUT` request overwrites
        the whole thing. To update the data, do a read-modify-write with
        `GET /clientData`. By convention, you should encapsulate your data in a
        uniquely-named sub-object so it can coexist with other clients'. For example:

        ```json
        {
          "data": {
            "exampleOrganizationName/deckSetupWizard/v2": {
              "currentDeckSetupStep": 3,
              "deckSetupSteps": { /* ... */ }
            }
          }
        }
        ```

        The data is cleared when the robot reboots.
        """
    ),
)
async def put_client_data(  # noqa: D103
    request_body: RequestModel[ClientData],
    store: ClientDataStore = fastapi.Depends(get_client_data_store),
) -> SimpleBody[ClientData]:
    store.put(request_body.data)
    return SimpleBody(data=store.get())


@router.get(
    path="/clientData",
    summary="Get client-defined data",
    description="Return the currently-stored client data. See `PUT /clientData`.",
)
async def get_client_data(  # noqa: D103
    store: ClientDataStore = fastapi.Depends(get_client_data_store),
) -> SimpleBody[ClientData]:
    return SimpleBody(data=store.get())
