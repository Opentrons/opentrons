from typing import Annotated

import fastapi
from pydantic import BaseModel, Field

from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
)

from auth_server.oauth2.backend import Backend
from auth_server.oauth2.fastapi_dependencies import get_oauth2_backend
from auth_server.users.scopes import Scope
from auth_server.users.store import TEST_USERS, AccountType, User

router = fastapi.APIRouter()


class UserCreate(BaseModel):
    """Request body for creating a user."""

    userName: str
    password: str = Field(..., description="The password for the user.")
    fullName: str = Field(..., description="The full name of the user.")
    accountType: str = Field(..., description="The type of account for the user.")


class UserResponse(BaseModel):
    """Response body for a user (no password)."""

    userName: str
    fullName: str
    accountType: str
    scopes: list[str]


def _validate_user_create_input(
    user_name: str,
    password: str,
    full_name: str,
    account_type: str,
) -> None:
    """Validate required fields for user creation. Raises HTTPException if any are empty."""
    if user_name == "" or password == "" or full_name == "" or account_type == "":
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="User name and password are required",
        )


@PydanticResponse.wrap_route(
    router.post,
    path="/auth/users",
    summary="Create a user",
    description="Create a new user.",
    responses={
        fastapi.status.HTTP_201_CREATED: {"model": SimpleBody[UserResponse]},
    },
)
async def post_users(
    request: fastapi.Request,
    request_body: RequestModel[UserCreate],
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Create a user."""
    user_name = request_body.data.userName if request_body is not None else ""
    password = request_body.data.password if request_body is not None else ""
    full_name = request_body.data.fullName if request_body is not None else ""
    account_type = (
        request_body.data.accountType if request_body is not None else AccountType.USER
    )
    _validate_user_create_input(user_name, password, full_name, account_type)
    user = next(
        (
            user
            for user in TEST_USERS
            if user.username == user_name and user.password == password
        ),
        None,
    )
    if user is not None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )
    new_user = User(
        username=user_name,
        password=password,
        full_name=full_name,
        account_type=AccountType(account_type),
        scopes={Scope.USERS_WRITE},
    )

    TEST_USERS.append(new_user)
    assert new_user in TEST_USERS
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_201_CREATED,
        content=SimpleBody(
            data=UserResponse(
                userName=new_user.username,
                fullName=new_user.full_name,
                accountType=new_user.account_type,
                scopes=[scope.value for scope in new_user.scopes],
            )
        ),
    )


# @PydanticResponse.wrap_route(
#     router.get,
#     path=f"/auth/users/{userName}",
#     summary="Get a user information",
#     description="Get a specific user by its unique identifier.",
#     responses={
#         fastapi.status.HTTP_200_OK: {"model": SimpleBody[UserResponse]},
#         fastapi.status.HTTP_404_NOT_FOUND: {"userNotFound": None},
#     },
# )
# async def get_users(
#     request: fastapi.Request,
#     userName: str,
#     oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
# ) -> PydanticResponse[SimpleBody[UserResponse]]:
# """Get all users."""
# user = next(
#     (
#         user
#         for user in TEST_USERS
#         if user.username == userName
#     ),
#     None,
# )
# return await PydanticResponse.create(
#     status_code=fastapi.status.HTTP_200_OK,
#     content=SimpleBody.model_construct(data=UserResponse(
#         userName=user.username,
#         fullName=user.full_name,
#         accountType=user.account_type,
#         scopes=[scope.value for scope in user.scopes],
#     )),
# )
