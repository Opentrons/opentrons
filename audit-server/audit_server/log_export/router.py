"""Route handlers for audit log export endpoints."""

from typing import Annotated

import fastapi

from server_utils.fastapi_utils.models.json_api import MultiBodyMeta, SimpleMultiBody

from audit_server.log_storage.dependency import get_log_data_manager
from audit_server.log_storage.log_data_manager import LogDataManager
from audit_server.log_storage.models import LogPeriodSummary

router = fastapi.APIRouter()


@router.get(
    "/audit/external/logPeriods",
    summary="Get all audit log periods",
    description="Returns all stored audit log periods, ordered oldest first.",
)
async def get_log_periods(
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
) -> SimpleMultiBody[LogPeriodSummary]:
    """Get all audit log periods."""
    periods = log_data_manager.get_log_periods()
    return SimpleMultiBody.model_construct(
        data=periods,
        meta=MultiBodyMeta(cursor=0, totalLength=len(periods)),
    )
