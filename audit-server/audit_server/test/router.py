"""Route handlers for the lifecycle test endpoint."""

import fastapi
import pydantic

from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    SimpleBody,
)


class TestResponseData(pydantic.BaseModel):
    """A response confirming the audit server is reachable."""

    status: str


router = fastapi.APIRouter()


@PydanticResponse.wrap_route(
    router.get,
    path="/audit/external/test",
    summary="Liveness test endpoint",
    responses={fastapi.status.HTTP_200_OK: {"model": SimpleBody[TestResponseData]}},
)
async def get_test() -> PydanticResponse[SimpleBody[TestResponseData]]:
    """Return a static OK payload to verify the server is up."""
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody.model_construct(data=TestResponseData(status="ok")),
    )
