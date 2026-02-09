from typing import Annotated

import fastapi
from pydantic import BaseModel, Field

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


@router.post("/auth/users")
async def post_users(
    request: fastapi.Request,
    request_body: UserCreate,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> PydanticResponse[SimpleBody[UserResponse]]:
    """Create a user."""
    user_name = request_body.userName if request_body is not None else ""
    password = request_body.password if request_body is not None else ""
    full_name = request_body.fullName if request_body is not None else ""
    account_type = (
        request_body.accountType if request_body is not None else AccountType.USER
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
    user = User(
        username=user_name,
        password=password,
        full_name=full_name,
        account_type=AccountType(account_type),
        scopes={Scope.USERS_WRITE},
    )
    TEST_USERS.append(user)
    assert user in TEST_USERS
    return fastapi.responses.JSONResponse(
        status_code=fastapi.status.HTTP_201_CREATED,
        content=UserResponse(
            userName=user.username,
            fullName=user.full_name,
            accountType=user.account_type,
            scopes=sorted(user.scopes),
        ).model_dump(),
    )
