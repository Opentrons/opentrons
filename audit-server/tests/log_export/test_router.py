"""Unit tests for the `GET /audit/external/logPeriods` route."""

from __future__ import annotations

from datetime import datetime, timezone

from decoy import Decoy

from audit_server.log_export.router import get_log_periods
from audit_server.log_storage.log_data_manager import LogDataManager
from audit_server.log_storage.models import LogPeriodSummary

_OLDER_PERIOD = LogPeriodSummary(
    id=1,
    startedAt=datetime(2024, 1, 1, tzinfo=timezone.utc),
    endedAt=datetime(2024, 1, 2, tzinfo=timezone.utc),
)

_NEWER_PERIOD = LogPeriodSummary(
    id=2,
    startedAt=datetime(2024, 2, 1, tzinfo=timezone.utc),
    endedAt=None,
)


async def test_get_log_periods_empty(
    decoy: Decoy,
    mock_log_data_manager: LogDataManager,
) -> None:
    """It should return an empty data list and totalLength of 0."""
    decoy.when(mock_log_data_manager.get_log_periods()).then_return([])

    result = await get_log_periods(log_data_manager=mock_log_data_manager)

    assert result.data == []
    assert result.meta.totalLength == 0


async def test_get_log_periods_returns_all_periods(
    decoy: Decoy, mock_log_data_manager: LogDataManager
) -> None:
    """It should return all periods returned by the store."""
    decoy.when(mock_log_data_manager.get_log_periods()).then_return(
        [_NEWER_PERIOD, _OLDER_PERIOD]
    )

    result = await get_log_periods(log_data_manager=mock_log_data_manager)

    assert len(result.data) == 2
    assert result.meta.totalLength == 2


async def test_get_log_periods_preserves_store_order(
    decoy: Decoy, mock_log_data_manager: LogDataManager
) -> None:
    """It should return periods in the same order the store provides them."""
    decoy.when(mock_log_data_manager.get_log_periods()).then_return(
        [_NEWER_PERIOD, _OLDER_PERIOD]
    )

    result = await get_log_periods(log_data_manager=mock_log_data_manager)

    assert result.data[0].startedAt > result.data[1].startedAt
    assert result.data[0].endedAt is None
    assert result.data[1].endedAt is not None
