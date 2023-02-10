"""Application routes."""
from fastapi import APIRouter, Depends, responses
from system_server.persistence import get_sql_engine, get_uuid
import sqlalchemy
from uuid import UUID

router = APIRouter()


# TODO(fs, 02-02-2022): This is a placeholder just to refresh the database for
# testing before there are any real HTTP requests using it.
# Delete this as soon as a real HTTP request gets added!!!!!!
@router.put(
    "/system/refresh",
    summary="Refresh the databases",
    description=("Refresh the database"),
)
async def refresh_system_db(
    sql: sqlalchemy.engine.Engine = Depends(get_sql_engine),
    uuid: UUID = Depends(get_uuid),
) -> responses.PlainTextResponse:
    """Silly fake endpoint to refresh our database."""
    return responses.PlainTextResponse(f"OK: {uuid}\n")
