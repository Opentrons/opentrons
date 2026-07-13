"""Tests for the log data manager."""

from datetime import datetime, timezone

import pytest
from decoy import Decoy, matchers
from opentrons_shared_data.errors.exceptions import KeyStorageUnavailableError

from server_utils.keys.key_server import Client as KeyClient
from server_utils.keys.key_server import SignedMessageData, SignMessageData

from audit_server.log_storage import constants
from audit_server.log_storage.log_data_manager import LogDataManager, _GetTime
from audit_server.log_storage.store import (
    LogStore,
    NoActivePeriodError,
    NoLogInPeriodError,
)
from audit_server.log_storage.types import StoredLog
from audit_server.settings.store import SettingsStore


@pytest.fixture
def mock_store(decoy: Decoy) -> LogStore:
    """A mock log store."""
    return decoy.mock(cls=LogStore)


@pytest.fixture
def mock_time(decoy: Decoy) -> _GetTime:
    """Handle to alter the timestamps used in logs."""
    mt = decoy.mock(cls=_GetTime)
    decoy.when(mt.now()).then_return(datetime.now(timezone.utc))
    return mt


@pytest.fixture
def mock_settings(decoy: Decoy) -> SettingsStore:
    """A mock settings store."""
    settings = decoy.mock(cls=SettingsStore)
    decoy.when(settings.get_logging_enabled()).then_return(True)
    return settings


@pytest.fixture
def mock_key_client(decoy: Decoy) -> KeyClient:
    return decoy.mock(cls=KeyClient)


@pytest.fixture
def subject(
    mock_store: LogStore,
    mock_key_client: KeyClient,
    mock_settings: SettingsStore,
    mock_time: _GetTime,
) -> LogDataManager:
    """Get a LogDataManager to test."""
    return LogDataManager(
        key_client=mock_key_client,
        log_store=mock_store,
        settings_store=mock_settings,
        time_getter=mock_time,
    )


@pytest.fixture
def disable_logging(mock_settings: SettingsStore, decoy: Decoy) -> None:
    """Force logging off."""
    decoy.when(mock_settings.get_logging_enabled()).then_return(False)


async def test_store_log_stores_nothing_if_logging_disabled(
    subject: LogDataManager, disable_logging: None, mock_store: LogStore, decoy: Decoy
) -> None:
    """It should store no data if logging is disabled."""
    await subject.store_log("asd")
    decoy.verify(mock_store.tail_hash(), times=0)
    decoy.verify(mock_store.store_log(matchers.Anything()), times=0)


async def test_rotate_periods_does_nothing_if_logging_disabled(
    subject: LogDataManager,
    disable_logging: None,
    mock_store: LogStore,
    decoy: Decoy,
) -> None:
    """It should not interact with the store if logging is disabled."""
    await subject.rotate_periods()
    decoy.verify(mock_store.store_log(matchers.Anything()), times=0)
    decoy.verify(mock_store.start_period(matchers.Anything()), times=0)
    decoy.verify(mock_store.end_period(matchers.Anything()), times=0)


async def test_store_log_stores_log(
    subject: LogDataManager,
    mock_store: LogStore,
    decoy: Decoy,
    mock_key_client: KeyClient,
) -> None:
    """It should store the log it's passsed in and return a hash of its own devising."""
    log = StoredLog(
        message="helo",
        message_hash="helicopter",
        message_sig="hollycopter",
        sig_version="3",
    )
    decoy.when(mock_store.tail_hash()).then_return("ph")
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData(message="helo", previousHash="ph")
        )
    ).then_return(
        SignedMessageData(
            message="helo",
            messageHash="helicopter",
            messageSignature="hollycopter",
            signatureVersion=3,
        )
    )
    decoy.when(mock_store.store_log(log)).then_return("fffff")
    stored_hash = await subject.store_log("helo")
    assert stored_hash == "fffff"


async def test_store_log_raises_keyserver_unavailable(
    subject: LogDataManager,
    mock_store: LogStore,
    decoy: Decoy,
    mock_key_client: KeyClient,
) -> None:
    """It should raise if the key server is unavailable."""
    decoy.when(mock_store.tail_hash()).then_return("oh well")
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData(message="mymessage", previousHash="oh well")
        )
    ).then_raise(Exception("nope im broken"))
    with pytest.raises(KeyStorageUnavailableError):
        await subject.store_log("mymessage")


async def test_store_log_rotates_if_cannot_get_tail_hash(
    subject: LogDataManager,
    mock_store: LogStore,
    decoy: Decoy,
    mock_key_client: KeyClient,
    mock_time: _GetTime,
) -> None:
    """It should rotate log periods if it cannot get the last hash."""
    decoy.when(mock_store.tail_hash()).then_return(NoActivePeriodError())
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(".*Log period begun.*"),
                previousHash=None,
            )
        )
    ).then_return(
        SignedMessageData(
            message="log period begun",
            messageHash="he",
            messageSignature="lo",
            signatureVersion=3,
        )
    )
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(".*log-error.*"), previousHash="he"
            )
        )
    ).then_return(
        SignedMessageData(
            message="log error",
            messageHash="go",
            messageSignature="od",
            signatureVersion=4,
        )
    )
    decoy.when(
        mock_store.store_log(
            StoredLog(
                message="log period begun",
                message_hash="he",
                message_sig="lo",
                sig_version="3",
            )
        )
    ).then_return("he")
    decoy.when(
        mock_store.store_log(
            StoredLog(
                message="log error",
                message_hash="go",
                message_sig="od",
                sig_version="4",
            )
        )
    ).then_return("od")
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(".*mymessage.*"),
                previousHash="go",
            )
        )
    ).then_return(
        SignedMessageData(
            message="my message",
            messageHash="by",
            messageSignature="ee",
            signatureVersion=5,
        )
    )
    decoy.when(
        mock_store.store_log(
            StoredLog(
                message="my message",
                message_hash="by",
                message_sig="ee",
                sig_version="5",
            )
        )
    ).then_return("ee")
    decoy.when(
        mock_store.start_period(
            [
                StoredLog(
                    message="log period begun",
                    message_hash="he",
                    message_sig="lo",
                    sig_version="3",
                ),
                StoredLog(
                    message="log error",
                    message_hash="go",
                    message_sig="od",
                    sig_version="4",
                ),
            ]
        )
    ).then_return("go")
    result = await subject.store_log("mymessage")
    assert result == "ee"


async def test_rotate_happypath(
    subject: LogDataManager,
    mock_store: LogStore,
    decoy: Decoy,
    mock_key_client: KeyClient,
    mock_time: _GetTime,
) -> None:
    """It should rotate log periods without errors cleanly."""
    decoy.when(mock_store.tail_hash()).then_return("gg")
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.ACTION_LOG_PERIOD_END}.*"
                ),
                previousHash="gg",
            )
        )
    ).then_return(
        SignedMessageData(
            message="end-log-period",
            messageHash="ff",
            messageSignature="s1",
            signatureVersion=1,
        )
    )
    decoy.when(
        mock_store.end_period(
            [
                StoredLog(
                    message="end-log-period",
                    message_hash="ff",
                    message_sig="s1",
                    sig_version="1",
                )
            ]
        )
    ).then_return("ff")
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.ACTION_LOG_PERIOD_START}.*"
                ),
                previousHash="ff",
            )
        )
    ).then_return(
        SignedMessageData(
            message="start-log-period",
            messageHash="ee",
            messageSignature="s2",
            signatureVersion=2,
        )
    )
    decoy.when(
        mock_store.start_period([StoredLog("start-log-period", "ee", "s2", "2")])
    ).then_return("ee")
    assert await subject.rotate_periods() == "ee"


async def test_rotate_no_previous_period(
    subject: LogDataManager,
    mock_store: LogStore,
    decoy: Decoy,
    mock_key_client: KeyClient,
    mock_time: _GetTime,
) -> None:
    """It should not emit an end-period message if there is no period to end."""
    decoy.when(mock_store.tail_hash()).then_return(NoActivePeriodError())
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.ACTION_LOG_PERIOD_START}.*"
                ),
                previousHash=None,
            )
        )
    ).then_return(
        SignedMessageData(
            message="start-log-period",
            messageHash="ff",
            messageSignature="s1",
            signatureVersion=1,
        )
    )
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_NO_PREVIOUS_PERIOD}.*"
                ),
                previousHash="ff",
            )
        )
    ).then_return(
        SignedMessageData(
            message="error-no-period",
            messageHash="ee",
            messageSignature="s2",
            signatureVersion=2,
        )
    )
    decoy.when(
        mock_store.start_period(
            [
                StoredLog(
                    message="start-log-period",
                    message_hash="ff",
                    message_sig="s1",
                    sig_version="1",
                ),
                StoredLog(
                    message="error-no-period",
                    message_hash="ee",
                    message_sig="s2",
                    sig_version="2",
                ),
            ]
        )
    ).then_return("ee")
    assert await subject.rotate_periods() == "ee"


async def test_rotate_no_previous_log(
    subject: LogDataManager,
    mock_store: LogStore,
    decoy: Decoy,
    mock_key_client: KeyClient,
    mock_time: _GetTime,
) -> None:
    """It should emit an end-period message with an empty hash if there is no previous log."""
    decoy.when(mock_store.tail_hash()).then_return(NoLogInPeriodError())
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_NO_PREVIOUS_LOG}.*"
                ),
                previousHash=None,
            )
        )
    ).then_return(
        SignedMessageData(
            message="error-no-log",
            messageHash="ff",
            messageSignature="s1",
            signatureVersion=1,
        )
    )
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_LOG_PERIOD_END}.*"
                ),
                previousHash="ff",
            )
        )
    ).then_return(
        SignedMessageData(
            message="end-period",
            messageHash="ee",
            messageSignature="s2",
            signatureVersion=2,
        )
    )
    decoy.when(
        mock_store.end_period(
            [
                StoredLog("error-no-log", "ff", "s1", "1"),
                StoredLog("end-period", "ee", "s2", "2"),
            ]
        )
    ).then_return("ee")
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_LOG_PERIOD_START}.*"
                ),
                previousHash="ee",
            )
        )
    ).then_return(
        SignedMessageData(
            message="start-period",
            messageHash="dd",
            messageSignature="s3",
            signatureVersion=3,
        )
    )
    decoy.when(
        mock_store.start_period(
            [
                StoredLog(
                    message="start-period",
                    message_hash="dd",
                    message_sig="s3",
                    sig_version="3",
                )
            ]
        )
    ).then_return("dd")
    assert await subject.rotate_periods() == "dd"


async def test_rotate_log_happypath_handles_no_keyserver(
    subject: LogDataManager,
    mock_store: LogStore,
    decoy: Decoy,
    mock_key_client: KeyClient,
    mock_time: _GetTime,
) -> None:
    """It should log key server failures and still rotate period."""
    decoy.when(mock_store.tail_hash()).then_return("aa")
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_LOG_PERIOD_END}.*"
                ),
                previousHash="aa",
            )
        )
    ).then_raise(KeyStorageUnavailableError())
    decoy.when(
        mock_store.end_period(
            [
                StoredLog(
                    message=matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_SIGNING_UNAVAILABLE}.*"
                    ),
                    message_hash="",
                    message_sig="",
                    sig_version="-1",
                ),
                StoredLog(
                    matchers.StringMatching(f".*{constants.MESSAGE_LOG_PERIOD_END}.*"),
                    "",
                    "",
                    "-1",
                ),
            ]
        )
    ).then_return("")
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_LOG_PERIOD_START}.*"
                ),
                previousHash=None,
            )
        )
    ).then_raise(KeyStorageUnavailableError())
    decoy.when(
        mock_store.start_period(
            [
                StoredLog(
                    message=matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_PERIOD_START}.*"
                    ),
                    message_hash="",
                    message_sig="",
                    sig_version="-1",
                ),
                StoredLog(
                    message=matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_SIGNING_UNAVAILABLE}.*"
                    ),
                    message_hash="",
                    message_sig="",
                    sig_version="-1",
                ),
            ]
        )
    ).then_return("dd")
    assert await subject.rotate_periods() == "dd"


async def test_rotate_no_previous_period_handles_no_keyserver(
    subject: LogDataManager,
    mock_store: LogStore,
    decoy: Decoy,
    mock_key_client: KeyClient,
    mock_time: _GetTime,
) -> None:
    """Its no-previous-period codepath should handle no key server.."""
    decoy.when(mock_store.tail_hash()).then_return(NoActivePeriodError())
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.ACTION_LOG_PERIOD_START}.*"
                ),
                previousHash=None,
            )
        )
    ).then_raise(KeyStorageUnavailableError())
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_NO_PREVIOUS_PERIOD}.*"
                ),
                previousHash=None,
            )
        )
    ).then_raise(KeyStorageUnavailableError())
    decoy.when(
        mock_store.start_period(
            [
                StoredLog(
                    message=matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_PERIOD_START}.*"
                    ),
                    message_hash="",
                    message_sig="",
                    sig_version="-1",
                ),
                StoredLog(
                    message=matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_SIGNING_UNAVAILABLE}.*"
                    ),
                    message_hash="",
                    message_sig="",
                    sig_version="-1",
                ),
                StoredLog(
                    message=matchers.StringMatching(
                        f".*{constants.MESSAGE_NO_PREVIOUS_PERIOD}.*"
                    ),
                    message_hash="",
                    message_sig="",
                    sig_version="-1",
                ),
                StoredLog(
                    message=matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_SIGNING_UNAVAILABLE}.*"
                    ),
                    message_hash="",
                    message_sig="",
                    sig_version="-1",
                ),
            ]
        )
    ).then_return("")
    assert await subject.rotate_periods() == ""


async def test_rotate_no_previous_log_handles_no_key_server(
    subject: LogDataManager,
    mock_store: LogStore,
    decoy: Decoy,
    mock_key_client: KeyClient,
    mock_time: _GetTime,
) -> None:
    """Rotation after no previous log should handle no key server."""
    decoy.when(mock_store.tail_hash()).then_return(NoLogInPeriodError())
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_NO_PREVIOUS_LOG}.*"
                ),
                previousHash=None,
            )
        )
    ).then_raise(KeyStorageUnavailableError())
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_LOG_PERIOD_END}.*"
                ),
                previousHash=None,
            )
        )
    ).then_raise(KeyStorageUnavailableError())
    decoy.when(
        mock_store.end_period(
            [
                StoredLog(
                    matchers.StringMatching(f".*{constants.MESSAGE_NO_PREVIOUS_LOG}.*"),
                    "",
                    "",
                    "-1",
                ),
                StoredLog(
                    matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_SIGNING_UNAVAILABLE}.*"
                    ),
                    "",
                    "",
                    "-1",
                ),
                StoredLog(
                    matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_SIGNING_UNAVAILABLE}.*"
                    ),
                    "",
                    "",
                    "-1",
                ),
                StoredLog(
                    matchers.StringMatching(f".*{constants.MESSAGE_LOG_PERIOD_END}.*"),
                    "",
                    "",
                    "-1",
                ),
            ]
        )
    ).then_return("")
    decoy.when(
        await mock_key_client.sign_message(
            SignMessageData.model_construct(
                message=matchers.StringMatching(
                    f".*{constants.MESSAGE_LOG_PERIOD_START}.*"
                ),
                previousHash=None,
            )
        )
    ).then_raise(KeyStorageUnavailableError())
    decoy.when(
        mock_store.start_period(
            [
                StoredLog(
                    message=matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_PERIOD_START}.*"
                    ),
                    message_hash="",
                    message_sig="",
                    sig_version="-1",
                ),
                StoredLog(
                    matchers.StringMatching(
                        f".*{constants.MESSAGE_LOG_SIGNING_UNAVAILABLE}.*"
                    ),
                    "",
                    "",
                    "-1",
                ),
            ]
        )
    ).then_return("")
    assert await subject.rotate_periods() == ""
