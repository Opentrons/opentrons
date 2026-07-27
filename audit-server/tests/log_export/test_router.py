"""Unit tests for the `GET /audit/external/logPeriods` route."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from decoy import Decoy, matchers

from server_utils.keys.key_server import Client as KeyClient
from server_utils.keys.key_server import PublicKeyAndHash, SignedMessageData
from server_utils.persistence.persistence_directory import PERSISTENCE_TEMP_SUBDIRECTORY
from server_utils.robot.robot_server import Client as RobotServerClient
from server_utils.robot.robot_server import RobotNameandSerial

from audit_server.deletion_keys.store import DeletionKeyStore
from audit_server.log_export.router import download_log_period, get_log_periods
from audit_server.log_storage.log_data_manager import LogDataManager
from audit_server.log_storage.models import LogPeriodSummary, UserLogForExport
from audit_server.log_storage.types import LogPeriodEntries

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


async def test_download_log_period_stages_under_persistence_temp(
    decoy: Decoy,
    mock_log_data_manager: LogDataManager,
    mock_key_client: KeyClient,
    tmp_path: Path,
) -> None:
    """It should stage the zip under persistence_root/temp/."""
    mock_robot_server_client = decoy.mock(cls=RobotServerClient)
    mock_deletion_key_store = decoy.mock(cls=DeletionKeyStore)
    period_entries = LogPeriodEntries(
        user_log=UserLogForExport(
            userLogEntries=[],
            startedAt=datetime(2024, 1, 1, tzinfo=timezone.utc),
            endedAt=None,
        ),
        robot_log_entries=[],
    )
    decoy.when(mock_log_data_manager.get_period_entries(period_id="1")).then_return(
        period_entries
    )
    decoy.when(await mock_key_client.get_key_and_hash()).then_return(
        PublicKeyAndHash(publicKey="public-key", publicHash="public-hash")
    )
    decoy.when(await mock_robot_server_client.get_name_and_serial()).then_return(
        RobotNameandSerial(name="my robot", serial="123abc")
    )
    decoy.when(await mock_key_client.sign_message(matchers.Anything())).then_return(
        SignedMessageData(
            message="{}",
            messageHash="hash",
            messageSignature="sig",
            signatureVersion=1,
        )
    )
    decoy.when(
        mock_deletion_key_store.create_deletion_key(
            foreign_id=1, foreign_type="logPeriod"
        )
    ).then_return("a-deletion-key")

    result = await download_log_period(
        periodId="1",
        log_data_manager=mock_log_data_manager,
        key_client=mock_key_client,
        robot_server_client=mock_robot_server_client,
        persistence_directory_root=tmp_path,
        deletion_key_store=mock_deletion_key_store,
    )

    assert result.headers["opentrons-log-period-deletion-key"] == "a-deletion-key"

    zip_path = Path(result.path)
    assert zip_path.is_relative_to(tmp_path / PERSISTENCE_TEMP_SUBDIRECTORY)
    assert zip_path.exists()

    assert result.background is not None
    await result.background()
    assert not zip_path.exists()
