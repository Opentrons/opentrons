from typing import Annotated

import fastapi
from pydantic import BaseModel, Field

from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
)

from auth_server.oauth2.backend import Backend
from auth_server.oauth2.fastapi_dependencies import get_oauth2_backend
from auth_server.users.scopes import Scope
from auth_server.users.store import TEST_USERS, AccountType, User, hash_password

router = fastapi.APIRouter()


class UserCreate(BaseModel):
    """Request body for creating a user."""

    userName: str
    password: str = Field(..., description="The password for the user.")
    fullName: str = Field(..., description="The full name of the user.")
    accountType: str = Field(..., description="The type of account for the user.")


class UpdateUser(BaseModel):
    """Request body for updating a user."""

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

    if len(password) < 8:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
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
    # once we store it in the db we can have a unique id as well.
    new_user = User(
        username=user_name,
        password=hash_password(password),
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


@PydanticResponse.wrap_route(
    router.get,
    path="/auth/users/{userName}",
    summary="Get a user information",
    description="Get a specific user by its unique identifier.",
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[UserResponse]},
        fastapi.status.HTTP_404_NOT_FOUND: {"userNotFound": None},
    },
)
async def get_user(
    request: fastapi.Request,
    userName: str,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Get a user by its unique identifier."""
    user = next(
        (user for user in TEST_USERS if user.username == userName),
        None,
    )
    if user is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(
            data=UserResponse(
                userName=user.username,
                fullName=user.full_name,
                accountType=user.account_type,
                scopes=[scope.value for scope in user.scopes],
            )
        ),
    )


@PydanticResponse.wrap_route(
    router.delete,
    path="/auth/users/{userName}",
    summary="Delete a user",
    description="Delete a specific user by its unique identifier.",
    responses={
        fastapi.status.HTTP_204_NO_CONTENT: {"description": "User deleted"},
    },
)
async def delete_user(
    request: fastapi.Request,
    userName: str,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete a user by its unique identifier."""
    user = next(
        (user for user in TEST_USERS if user.username == userName),
        None,
    )
    if user is None:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_404_NOT_FOUND)
    TEST_USERS.remove(user)
    return await PydanticResponse.create(
        content=SimpleEmptyBody.model_construct(),
        status_code=fastapi.status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    router.patch,
    path="/auth/users/{userName}",
    summary="Update a user",
    description="Update a specific user by its unique identifier.",
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[UserResponse]},
    },
)
async def update_user(
    request: fastapi.Request,
    request_body: RequestModel[UpdateUser],
    userName: str,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Update a user by its unique identifier."""
    user = next(
        (user for user in TEST_USERS if user.username == userName),
        None,
    )
    if user is None:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_404_NOT_FOUND)
    # if the userName is the unique identifier cannot update it.
    # how should we handle password update?
    updated_user = User(
        username=user.username,
        password=user.password,
        full_name=request_body.data.fullName,
        account_type=AccountType(request_body.data.accountType),
        scopes=user.scopes,
    )
    idx = TEST_USERS.index(user)
    TEST_USERS[idx] = updated_user
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(
            data=UserResponse(
                userName=updated_user.username,
                fullName=updated_user.full_name,
                accountType=updated_user.account_type,
                scopes=[scope.value for scope in updated_user.scopes],
            )
        ),
    )
