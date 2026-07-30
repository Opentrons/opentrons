import datetime
from typing import Annotated

import fastapi

from server_utils.audit.audit_logger import AuditLogger
from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import (
    RequireAuthenticationResult,
    require_authentication,
    require_scopes,
)
from server_utils.auth.resource_server.types import AuthenticatedResult
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.models.json_api import (
    MultiBodyMeta,
    PydanticResponse,
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
    SimpleMultiBody,
)

from auth_server.api_error import APIError
from auth_server.users.dependencies import get_user_by_username, get_user_data_manager
from auth_server.users.models import (
    AccountType,
    ErrorBody,
    PasswordMissingSpecialCharactersErrorDetails,
    PasswordTooShortErrorDetails,
    TemporaryPasswordResponse,
    UpdateSelf,
    UpdateUser,
    UserAlreadyExistsErrorDetails,
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
        fastapi.status.HTTP_201_CREATED: {
            "model": SimpleBody[TemporaryPasswordResponse]
        },
        fastapi.status.HTTP_400_BAD_REQUEST: {
            "model": ErrorBody[
                PasswordTooShortErrorDetails
                | PasswordMissingSpecialCharactersErrorDetails
                | UserAlreadyExistsErrorDetails
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
) -> PydanticResponse[SimpleBody[TemporaryPasswordResponse]]:
    """Create a user."""
    user_create = request_body.data
    now = datetime.datetime.now(tz=datetime.UTC)
    audit_logger.append_message_chunk(
        f"New user with username={user_create.username}, fullName={user_create.fullName}, accountType={user_create.accountType}"
    )
    try:
        new_user = user_data_manager.create_user(
            username=user_create.username,
            password=(
                user_create.password.get_secret_value()
                if user_create.password is not None
                else None
            ),
            full_name=user_create.fullName,
            account_type=user_create.accountType,
            now=now,
        )
    except UserAlreadyExistsError:
        raise APIError(
            fastapi.status.HTTP_400_BAD_REQUEST, _build_user_already_exists_error()
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
    path="/auth/users",
    summary="List users",
    description="List all users. Requires admin credentials.",
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleMultiBody[UserResponse]},
    },
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_WRITE))],
)
async def get_users(
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleMultiBody[UserResponse]]:
    """List all users."""
    users = user_data_manager.get_users_list()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleMultiBody.model_construct(
            data=users,
            meta=MultiBodyMeta(cursor=0, totalLength=len(users)),
        ),
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
    dependencies=[
        fastapi.Depends(require_scopes(Scope.USERS_WRITE)),
        fastapi.Depends(get_audit_logger("delete user")),
    ],
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
                | UserAlreadyExistsErrorDetails
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
    audit_logger: Annotated[
        AuditLogger,
        fastapi.Depends(get_audit_logger("update user", auto_log_request_body=False)),
    ],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Update a user by its unique identifier."""
    update_data = request_body.data
    now = datetime.datetime.now(tz=datetime.UTC)

    def _field_or_empty(field_name: str, field: str | AccountType | bool | None) -> str:
        if field is None:
            return ""
        return f"{field_name}={str(field)}"

    audit_logger.append_message_chunk(
        "Update user: "
        + ", ".join(
            [
                _field_or_empty("username", update_data.username),
                _field_or_empty("fullName", update_data.fullName),
                _field_or_empty("accountType", update_data.accountType),
                _field_or_empty("resetPassword", update_data.resetPassword),
                _field_or_empty("locked", update_data.locked),
            ]
        )
    )
    try:
        updated_user = user_data_manager.update_user(
            user.username,
            now=now,
            new_username=update_data.username,
            new_password=(
                update_data.password.get_secret_value()
                if update_data.password is not None
                else None
            ),
            new_full_name=update_data.fullName,
            new_account_type=update_data.accountType,
            new_locked=update_data.locked,
            reset_password=update_data.resetPassword is True,
        )
    except UserAlreadyExistsError:
        raise APIError(
            fastapi.status.HTTP_400_BAD_REQUEST, _build_user_already_exists_error()
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
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[TemporaryPasswordResponse]},
        fastapi.status.HTTP_404_NOT_FOUND: {"userNotFound": None},
    },
    dependencies=[
        fastapi.Depends(require_scopes(Scope.USERS_WRITE)),
        fastapi.Depends(
            get_audit_logger("reset password", auto_log_response_body=False)
        ),
    ],
)
async def reset_user_password(
    user: Annotated[UserResponse, fastapi.Depends(get_user_by_username)],
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[TemporaryPasswordResponse]]:
    """Reset a user's password to a random temporary password."""
    result = user_data_manager.reset_user_password(
        user.username,
        now=datetime.datetime.now(tz=datetime.UTC),
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
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_READ_SELF))],
)
async def get_self(  # noqa: D103
    authentication: Annotated[
        RequireAuthenticationResult, fastapi.Depends(require_authentication)
    ],
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    if not isinstance(authentication, AuthenticatedResult):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="This endpoint needs an access token to determine the current user.",
        )

    # Note: Does not use get_user_by_username. If the user passed require_scopes() but
    # we cannot find them here, that is a server bug and should surface as 500.
    user = user_data_manager.get_user(authentication.username)

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
    dependencies=[fastapi.Depends(require_scopes(Scope.USERS_WRITE_SELF))],
    responses={
        fastapi.status.HTTP_200_OK: {"model": SimpleBody[UserResponse]},
        fastapi.status.HTTP_400_BAD_REQUEST: {
            "model": ErrorBody[
                PasswordTooShortErrorDetails
                | PasswordMissingSpecialCharactersErrorDetails
                | UserAlreadyExistsErrorDetails
            ]
        },
        fastapi.status.HTTP_401_UNAUTHORIZED: {},
    },
)
async def update_self(
    request_body: RequestModel[UpdateSelf],
    authentication: Annotated[
        RequireAuthenticationResult, fastapi.Depends(require_authentication)
    ],
    user_data_manager: Annotated[
        UserDataManager, fastapi.Depends(get_user_data_manager)
    ],
    audit_logger: Annotated[
        AuditLogger,
        fastapi.Depends(
            get_audit_logger(
                "update own user",
                # Custom logs of request body to avoid logging passwords
                auto_log_request_body=False,
            ),
        ),
    ],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Update the current user's profile and/or password."""
    if not isinstance(authentication, AuthenticatedResult):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="This endpoint needs an access token to determine the current user.",
        )

    def _field_or_empty(field_name: str, field: str | AccountType | bool | None) -> str:
        if field is None:
            return ""
        return f"{field_name}={str(field)}"

    update_data = request_body.data
    audit_logger.append_message_chunk(
        "Update self: "
        + ", ".join(
            [
                _field_or_empty("username", update_data.username),
                _field_or_empty("fullName", update_data.fullName),
            ]
        )
    )

    if (
        update_data.username is None
        and update_data.fullName is None
        and update_data.password is None
    ):
        return await PydanticResponse.create(
            status_code=fastapi.status.HTTP_200_OK,
            content=SimpleBody(
                data=user_data_manager.get_user(authentication.username)
            ),
        )

    try:
        result = user_data_manager.update_user(
            authentication.username,
            new_username=update_data.username,
            new_password=(
                update_data.password.get_secret_value()
                if update_data.password is not None
                else None
            ),
            new_full_name=update_data.fullName,
            now=datetime.datetime.now(tz=datetime.UTC),
        )
    except UserAlreadyExistsError:
        raise APIError(
            fastapi.status.HTTP_400_BAD_REQUEST, _build_user_already_exists_error()
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


def _build_user_already_exists_error() -> ErrorBody[UserAlreadyExistsErrorDetails]:
    return ErrorBody(errors=[UserAlreadyExistsErrorDetails(id="userAlreadyExists")])


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
