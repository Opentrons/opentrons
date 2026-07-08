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

from auth_server.api_error import APIError
from auth_server.users.dependencies import get_user_by_username, get_user_data_manager
from auth_server.users.models import (
    ErrorBody,
    PasswordMissingSpecialCharactersErrorDetails,
    PasswordTooShortErrorDetails,
    ResetPasswordResponse,
    UpdateSelf,
    UpdateUser,
    UserCreate,
    UserResponse,
)
from auth_server.users.user_data_manager import (
    InvalidInputError,
    PasswordMissingSpecialCharactersError,
    PasswordTooShortError,
    UserAlreadyExistsError,
    UserDataManager,
)

router = fastapi.APIRouter()


@PydanticResponse.wrap_route(
    router.post,
    path="/auth/users",
    summary="Create a user",
    description="Create a new user.",
    responses={
        fastapi.status.HTTP_201_CREATED: {"model": SimpleBody[UserResponse]},
        fastapi.status.HTTP_400_BAD_REQUEST: {
            "model": ErrorBody[
                PasswordTooShortErrorDetails
                | PasswordMissingSpecialCharactersErrorDetails
            ]
        },
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
    user_create = request_body.data
    try:
        new_user = user_data_manager.create_user(
            username=user_create.username,
            password=user_create.password.get_secret_value(),
            full_name=user_create.fullName,
            account_type=user_create.accountType,
        )
    except UserAlreadyExistsError:
        # todo(mm, 2026-06-24): Convert this to a more structured error response.
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )
    except PasswordTooShortError as e:
        raise APIError(
            fastapi.status.HTTP_400_BAD_REQUEST, _build_password_too_short_error(e)
        ) from e
    except PasswordMissingSpecialCharactersError as e:
        raise APIError(
            fastapi.status.HTTP_400_BAD_REQUEST,
            _build_password_missing_special_characters_error(e),
        ) from e
    except InvalidInputError as e:
        # todo(mm, 2026-06-24): Convert this to a more structured error response.
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
    path="/auth/users/byUsername/{username}",
    summary="Get a user",
    description="Get a specific user, identified by their unique username.",
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[UserResponse]},
        fastapi.status.HTTP_404_NOT_FOUND: {"userNotFound": None},
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_READ_OTHERS))],
)
async def get_user(
    user: Annotated[UserResponse, fastapi.Depends(get_user_by_username)],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Get a user by its unique identifier."""
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(data=user),
    )


@PydanticResponse.wrap_route(
    router.delete,
    path="/auth/users/byUsername/{username}",
    summary="Delete a user",
    description="Delete a specific user, identified by their unique username.",
    responses={
        fastapi.status.HTTP_204_NO_CONTENT: {"description": "User deleted"},
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_WRITE))],
)
async def delete_user(
    user: Annotated[UserResponse, fastapi.Depends(get_user_by_username)],
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete a user by its unique identifier."""
    user_data_manager.delete_user(user.username)
    return await PydanticResponse.create(
        content=SimpleEmptyBody.model_construct(),
        status_code=fastapi.status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    router.patch,
    path="/auth/users/byUsername/{username}",
    summary="Update a user",
    description="Update a specific user, identified by their unique username.",
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[UserResponse]},
        fastapi.status.HTTP_400_BAD_REQUEST: {
            "model": ErrorBody[
                PasswordTooShortErrorDetails
                | PasswordMissingSpecialCharactersErrorDetails
            ]
        },
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_WRITE))],
)
async def update_user(
    request_body: RequestModel[UpdateUser],
    user: Annotated[UserResponse, fastapi.Depends(get_user_by_username)],
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Update a user by its unique identifier."""
    update_data = request_body.data
    try:
        updated_user = user_data_manager.update_user(
            user.username,
            new_username=update_data.username,
            new_password=update_data.password.get_secret_value()
            if update_data.password is not None
            else None,
            new_full_name=update_data.fullName,
            new_account_type=update_data.accountType,
            new_locked=update_data.locked,
            reset_password=update_data.resetPassword,
        )
    except UserAlreadyExistsError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )
    except PasswordTooShortError as e:
        raise APIError(
            fastapi.status.HTTP_400_BAD_REQUEST, _build_password_too_short_error(e)
        ) from e
    except PasswordMissingSpecialCharactersError as e:
        raise APIError(
            fastapi.status.HTTP_400_BAD_REQUEST,
            _build_password_missing_special_characters_error(e),
        ) from e
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
    path="/auth/users/byUsername/{username}/resetPassword",
    summary="Reset a user's password",
    description=(
        "Reset a specific user's password to a newly generated temporary password. "
        "The user must change their password upon next login."
    ),
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[ResetPasswordResponse]},
        fastapi.status.HTTP_404_NOT_FOUND: {"userNotFound": None},
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_WRITE))],
)
async def reset_user_password(
    user: Annotated[UserResponse, fastapi.Depends(get_user_by_username)],
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[ResetPasswordResponse]]:
    """Reset a user's password to a random temporary password."""
    result = user_data_manager.reset_user_password(user.username)
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

    # Note: Does not use get_user_by_username. If the user passed require_scopes() but
    # we cannot find them here, that is a server bug and should surface as 500.
    user = user_data_manager.get_user(authorization_details.username)

    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(data=user),
    )


@PydanticResponse.wrap_route(
    router.patch,
    path="/auth/users/self",
    summary="Update the currently logged-in user",
    description=(
        "Update the currently authenticated user, for example to set a new password "
        "when resetPassword is true."
    ),
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[UserResponse]},
        fastapi.status.HTTP_400_BAD_REQUEST: {
            "model": ErrorBody[
                PasswordTooShortErrorDetails
                | PasswordMissingSpecialCharactersErrorDetails
            ]
        },
        fastapi.status.HTTP_401_UNAUTHORIZED: {},
    },
)
async def update_self(
    request_body: RequestModel[UpdateSelf],
    authorization_details: Annotated[
        RequireScopesResult,
        fastapi.Depends(require_scopes(Scope.USERS_WRITE_SELF_PASSWORD)),
    ],
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Set the current user's password and clear the resetPassword flag."""
    if isinstance(authorization_details, AuthorizationNotRequiredResult):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="This endpoint needs an access token to determine the current user.",
        )

    try:
        result = user_data_manager.update_user(
            authorization_details.username,
            new_password=request_body.data.password.get_secret_value(),
        )
    except PasswordTooShortError as e:
        raise APIError(
            fastapi.status.HTTP_400_BAD_REQUEST, _build_password_too_short_error(e)
        ) from e
    except PasswordMissingSpecialCharactersError as e:
        raise APIError(
            fastapi.status.HTTP_400_BAD_REQUEST,
            _build_password_missing_special_characters_error(e),
        ) from e
    except InvalidInputError as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(data=result),
    )


def _build_password_too_short_error(
    error: PasswordTooShortError,
) -> ErrorBody[PasswordTooShortErrorDetails]:
    return ErrorBody(
        errors=[
            PasswordTooShortErrorDetails(
                id="passwordTooShort",
                meta={
                    "actualLength": error.actual_length,
                    "requiredLength": error.required_length,
                },
            )
        ]
    )


def _build_password_missing_special_characters_error(
    error: PasswordMissingSpecialCharactersError,
) -> ErrorBody[PasswordMissingSpecialCharactersErrorDetails]:
    return ErrorBody(
        errors=[
            PasswordMissingSpecialCharactersErrorDetails(
                id="passwordMissingSpecialCharacters"
            )
        ]
    )
