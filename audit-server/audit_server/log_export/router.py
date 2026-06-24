"""Route handlers for audit log export endpoints."""

from typing import Annotated

import fastapi

from server_utils.fastapi_utils.models.json_api import MultiBodyMeta, SimpleMultiBody

from audit_server.log_storage.dependency import get_log_store
from audit_server.log_storage.models import LogPeriodSummary
from audit_server.log_storage.store import LogStore

router = fastapi.APIRouter()


@router.get(
    "/audit/external/logPeriods",
    summary="Get all audit log periods",
    description="Returns all stored audit log periods, ordered oldest first.",
)
async def get_log_periods(
    log_store: Annotated[LogStore, fastapi.Depends(get_log_store)],
) -> SimpleMultiBody[LogPeriodSummary]:
    """Get all audit log periods."""
    periods = log_store.list_periods()
    return SimpleMultiBody.model_construct(
        data=periods,
        meta=MultiBodyMeta(cursor=0, totalLength=len(periods)),
    )
