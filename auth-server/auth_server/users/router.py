from typing import Annotated, Optional

import fastapi
from pydantic import BaseModel, Field, SecretStr

from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
)

from auth_server.oauth2.backend import Backend
from auth_server.oauth2.fastapi_dependencies import get_oauth2_backend
from auth_server.users.store import TEST_USERS, AccountType, User, hash_password

router = fastapi.APIRouter()


class UserCreate(BaseModel):
    """Request body for creating a user."""

    userName: Annotated[str, Field(..., description="The username of the user.")]
    password: Annotated[SecretStr, Field(..., description="The password for the user.")]
    fullName: Annotated[str, Field(..., description="The full name of the user.")]
    accountType: Annotated[
        str, Field(..., description="The type of account for the user.")
    ]


class UpdateUser(BaseModel):
    """Request body for updating a user."""

    userName: Annotated[
        Optional[str], Field(..., description="The username of the user.")
    ] = None
    password: Annotated[
        Optional[SecretStr], Field(..., description="The password for the user.")
    ] = None
    fullName: Annotated[
        Optional[str], Field(..., description="The full name of the user.")
    ] = None
    accountType: Annotated[
        Optional[str], Field(..., description="The type of account for the user.")
    ] = None


class UserResponse(BaseModel):
    """Response body for a user (no password)."""

    userName: str
    fullName: str
    accountType: str
    scopes: list[str]


def _verify_scopes(
    request: fastapi.Request,
    oauth2_backend: Backend,
    scopes: list[Scope],
    body: str = "",
) -> None:
    """Verify OAuth2 scopes. Raises 403 if invalid."""
    valid, _ = oauth2_backend.verify_request(
        str(request.url),
        http_method=request.method,  # type: ignore[arg-type]
        body=body,
        headers=dict(request.headers),
        scopes=[scope.api_name for scope in scopes],
    )
    if not valid:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )


def _get_user(username: str) -> User | None:
    """Look up a user by username. Returns the User or None."""
    return next(
        (user for user in TEST_USERS if user.username == username),
        None,
    )


def _validate_user_create_input(
    user_name: str | None = None,
    password: str | None = None,
    full_name: str | None = None,
    account_type: str | None = None,
) -> None:
    """Validate required fields for user creation. Raises HTTPException if any are empty."""
    if (
        user_name is not None
        and user_name == ""
        or password is not None
        and password == ""
        or full_name is not None
        and full_name == ""
        or account_type is not None
        and account_type == ""
    ):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Bad request",
        )

    if password is not None and len(password) < 8:
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
    scopes_required = [Scope.USERS_WRITE]
    _verify_scopes(request, oauth2_backend, scopes_required)
    user_create = request_body.data
    _validate_user_create_input(
        user_create.userName,
        user_create.password.get_secret_value(),
        user_create.fullName,
        user_create.accountType,
    )
    if _get_user(user_create.userName) is not None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )
    # once we store it in the db we can have a unique id as well.
    new_user = User(
        username=user_create.userName,
        hashed_password=hash_password(user_create.password.get_secret_value()),
        full_name=user_create.fullName,
        account_type=AccountType(user_create.accountType),
        scopes=scopes_required,
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
                scopes=[scope.api_name for scope in scopes_required],
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
    _verify_scopes(request, oauth2_backend, [Scope.USERS_WRITE])
    user = _get_user(userName)
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
    _verify_scopes(request, oauth2_backend, [Scope.USERS_WRITE])
    user = _get_user(userName)
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
    scopes_required = [Scope.USERS_WRITE]
    _verify_scopes(request, oauth2_backend, [Scope.USERS_WRITE])
    update_user = request_body.data
    _validate_user_create_input(
        user_name=update_user.userName,
        password=update_user.password.get_secret_value()
        if update_user.password is not None
        else None,
        full_name=update_user.fullName,
        account_type=update_user.accountType,
    )
    user = _get_user(userName)
    if user is None:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_404_NOT_FOUND)

    updated_user = User(
        username=update_user.userName or user.username,
        hashed_password=(
            hash_password(update_user.password.get_secret_value())
            if update_user.password is not None
            else user.hashed_password
        ),
        full_name=update_user.fullName or user.full_name,
        account_type=AccountType(update_user.accountType)
        if update_user.accountType
        else user.account_type,
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
