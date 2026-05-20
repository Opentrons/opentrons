from typing import Annotated

import fastapi

from server_utils.auth.resource_server.authorization_checker import (
    AuthorizationNotRequiredResult,
)
from server_utils.auth.resource_server.fastapi import (
    RequireScopesResult,
    require_scopes,
)
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
)

from auth_server.users.dependencies import get_user_data_manager
from auth_server.users.models import (
    ResetPasswordResponse,
    UpdateUser,
    UserCreate,
    UserResponse,
)
from auth_server.users.user_data_manager import (
    InvalidInputError,
    UserAlreadyExistsError,
    UserDataManager,
    UserNotFoundError,
)

router = fastapi.APIRouter()


@PydanticResponse.wrap_route(
    router.post,
    path="/auth/users",
    summary="Create a user",
    description="Create a new user.",
    responses={
        fastapi.status.HTTP_201_CREATED: {"model": SimpleBody[UserResponse]},
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_WRITE))],
)
async def post_users(
    request_body: RequestModel[UserCreate],
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Create a user."""
    # todo(mm, 2026-02-20): The new user's scopes should either depend on their account type,
    # or they should be passed in the request body.
    user_create = request_body.data
    try:
        new_user = user_data_manager.create_user(
            username=user_create.userName,
            password=user_create.password.get_secret_value(),
            full_name=user_create.fullName,
            account_type=user_create.accountType,
        )
    except UserAlreadyExistsError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )
    except InvalidInputError as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_201_CREATED,
        content=SimpleBody(data=new_user),
    )


@PydanticResponse.wrap_route(
    router.get,
    path="/auth/users/byUsername/{userName}",
    summary="Get a user",
    description="Get a specific user, identified by their unique username.",
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[UserResponse]},
        fastapi.status.HTTP_404_NOT_FOUND: {"userNotFound": None},
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_READ_OTHERS))],
)
async def get_user(
    userName: str,
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Get a user by its unique identifier."""
    try:
        user = user_data_manager.get_user(userName)
    except UserNotFoundError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(data=user),
    )


@PydanticResponse.wrap_route(
    router.delete,
    path="/auth/users/byUsername/{userName}",
    summary="Delete a user",
    description="Delete a specific user, identified by their unique username.",
    responses={
        fastapi.status.HTTP_204_NO_CONTENT: {"description": "User deleted"},
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_WRITE))],
)
async def delete_user(
    userName: str,
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete a user by its unique identifier."""
    try:
        user_data_manager.delete_user(userName)
    except UserNotFoundError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return await PydanticResponse.create(
        content=SimpleEmptyBody.model_construct(),
        status_code=fastapi.status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    router.patch,
    path="/auth/users/byUsername/{userName}",
    summary="Update a user",
    description="Update a specific user, identified by their unique username.",
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[UserResponse]},
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_WRITE))],
)
async def update_user(
    request_body: RequestModel[UpdateUser],
    userName: str,
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Update a user by its unique identifier."""
    update_data = request_body.data
    try:
        updated_user = user_data_manager.update_user(
            userName,
            new_username=update_data.userName,
            new_password=update_data.password.get_secret_value()
            if update_data.password is not None
            else None,
            new_full_name=update_data.fullName,
            new_account_type=update_data.accountType,
            new_locked=update_data.locked,
            reset_password=update_data.resetPassword,
            using_temporary_password=update_data.usingTemporaryPassword,
        )
    except UserNotFoundError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    except UserAlreadyExistsError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )
    except InvalidInputError as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(data=updated_user),
    )


@PydanticResponse.wrap_route(
    router.post,
    path="/auth/users/byUsername/{userName}/resetPassword",
    summary="Reset a user's password",
    description=(
        "Reset a specific user's password to a newly generated temporary password. "
        "The user will be marked as using a temporary password and must change it upon login."
    ),
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[ResetPasswordResponse]},
        fastapi.status.HTTP_404_NOT_FOUND: {"userNotFound": None},
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_WRITE))],
)
async def reset_user_password(
    userName: str,
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[ResetPasswordResponse]]:
    """Reset a user's password to a random temporary password."""
    try:
        result = user_data_manager.reset_user_password(userName)
    except UserNotFoundError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(data=result),
    )


@PydanticResponse.wrap_route(
    router.get,
    path="/auth/users/self",
    summary="Get the currently logged-in user",
    description=(
        'The "currently logged-in user" is determined from the OAuth 2 access token'
        " that you attach to your request to this endpoint."
        " See the `/auth/oauth2` endpoints."
    ),
    responses={fastapi.status.HTTP_401_UNAUTHORIZED: {}},
)
async def get_self(  # noqa: D103
    authorization_details: Annotated[
        RequireScopesResult, fastapi.Depends(require_scopes(Scope.USERS_READ_SELF))
    ],
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    if isinstance(authorization_details, AuthorizationNotRequiredResult):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="This endpoint needs an access token to determine the current user.",
        )

    # Note: No try/except for UserNotFoundError. If the user passed `require_scopes()`,
    # but we can't find them here, then that's some kind of server bug and we want to
    # let it propagate with HTTP error code 500.
    user = user_data_manager.get_user(authorization_details.username)

    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(data=user),
    )
