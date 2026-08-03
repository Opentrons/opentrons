"""Code for managing log period rotation and storage."""

import secrets
from asyncio import Lock
from datetime import datetime, timezone
from logging import getLogger
from typing import Final

from opentrons_shared_data.errors.exceptions import (
    AuditLoggingError,
    KeyStorageUnavailableError,
    PythonException,
)

from server_utils.keys.key_server import Client as KeyClient
from server_utils.keys.key_server import SignMessageData

from . import constants
from .models import LogPeriodDetails, LogPeriodSummary
from .store import LogStore, NoActivePeriodError, NoLogInPeriodError
from .types import LogPeriodEntries, StoredLog
from audit_server.log_ingest.models import AuditLogMessage
from audit_server.settings.store import (
    SettingsStore,
)

LOG = getLogger(__name__)

# Number of random bytes behind each deletion key. urlsafe encoding produces a
# longer string than this byte count.
_DELETION_KEY_BYTES: Final = 32


class _GetTime:
    def now(self) -> datetime:
        return datetime.now(timezone.utc)


class LogDataManager:
    """Object managing log periods and storage."""

    def __init__(
        self,
        key_client: KeyClient,
        log_store: LogStore,
        settings_store: SettingsStore,
        time_getter: _GetTime | None = None,
    ) -> None:
        self._key_client = key_client
        self._store = log_store
        self._settings = settings_store
        self._time = time_getter or _GetTime()
        self._lock = Lock()
        # One-time deletion keys, mapping a minted key to the id of the log
        # period it authorizes deleting. Held in memory only: keys are not
        # persisted and do not survive a process restart.
        self._deletion_keys: dict[str, str] = {}

    async def rotate_periods(self) -> str:
        """End the previous log period and start a new one.

        Returns the hash of the final message in the period.
        """
        if not self._settings.get_logging_enabled():
            return ""
        async with self._lock:
            return await self._do_rotate_periods()

    async def store_log(self, log_message: str) -> str:
        """Store a log message to the active period.

        If the key server is not available, this method raises before storing
        the current log, but it will log an (unsigned) error message first.
        """
        if not self._settings.get_logging_enabled():
            return ""
        async with self._lock:
            return await self._do_store_log(log_message)

    def get_log_periods(self) -> list[LogPeriodSummary]:
        """Get a list of log periods, active or inactive."""
        return self._store.list_periods()

    def get_period_entries(self, period_id: str) -> LogPeriodEntries:
        """Get the given log period's user and robot log entries."""
        return self._store.get_period_entries(period_id)

    def get_log_period_details(self, period_id: str) -> LogPeriodDetails:
        """Get aggregate details for a log period."""
        return self._store.get_period_details(period_id)

    def create_deletion_key(self, period_id: str) -> str:
        """Mint a new one-time deletion key linked to a log period.

        Keys are held in memory only and accumulate: each call mints a new
        distinct key, and previously issued keys for the same period remain
        valid.
        """
        key = secrets.token_urlsafe(_DELETION_KEY_BYTES)
        self._deletion_keys[key] = period_id
        return key

    async def _do_store_log(self, log_message: str) -> str:
        previous_hash = self._store.tail_hash()
        # regardless of whether there's no current period or no log in the period,
        # there's something wrong with the current log period so remove it.
        if not isinstance(previous_hash, str):
            previous_hash = await self._do_rotate_periods()

        # when storing a log from outside, unlike when storing the system-generated
        # logs that we make during log rotation, we should reject a log (to prevent
        # the upstream action that depends on it) if we can't sign it.
        signed_log, signing_exc = await self._sign_log(log_message, previous_hash)
        if signing_exc:
            raise KeyStorageUnavailableError(
                message="Unable to communicate with key server",
                wrapping=[PythonException(signing_exc)],
            )

        stored = self._store.store_log(signed_log)
        if isinstance(stored, str):
            return stored
        else:
            # this shouldn't happen, because we're past a possible key-signing error
            # and we just fixed up the log rotations, but if it does we should reject
            # so we don't get in an infinite loop
            raise AuditLoggingError(
                message="Unable to store log", wrapping=[PythonException(stored)]
            )

    def _build_system_message(self, action: str, message: str) -> str:
        """Build an audit log message originated by the system.

        The overall goal is that messages should be associated with humans, but sometimes
        the robot does something because of a human action that isn't mediated through
        software. For instance, we rotate log periods at boot, and we don't know why we
        booted up; and we want to log error messages. So we have to be able to build our
        own messages to log.
        """
        log_time = self._time.now()
        message_obj = AuditLogMessage(
            action=action,
            accountName=constants.ACCOUNT_NAME_SYSTEM,
            legalName=constants.LEGAL_NAME_SYSTEM,
            message=message,
            reason="",
            loggedAt=log_time,
        )
        return message_obj.model_dump_json(indent=None)

    def _build_sign_error_message(
        self, sign_error: BaseException, previous_hash: str | None
    ) -> StoredLog:
        """If the key server isn't running, we need to be able to log that.

        Specifically, we need to skip the signing (because it isn't working) and make
        a log message directly with an empty hash and signature. Any viewer should
        mark these as bad messages, because, well, they are - the key server being
        unavailable is a break in the system as a whole's trustability.
        """
        message_str = self._build_system_message(
            action=constants.ACTION_LOG_LOGGING_ERROR,
            message=constants.MESSAGE_LOG_SIGNING_UNAVAILABLE,
        )
        return StoredLog(
            message=message_str, message_hash="", message_sig="", sig_version="-1"
        )

    async def _stop_period(self) -> str | NoActivePeriodError:
        """Close a period as part of a log period rotation."""
        ending_messages: list[StoredLog] = []

        # if there's no period to close, then we have nothing to do, and errors
        # are noted at the beginning of the next period
        current_tail_hash = self._store.tail_hash()
        if isinstance(current_tail_hash, NoActivePeriodError):
            return current_tail_hash

        # if we have a valid period but no logs in it, not even a start, then that's
        # bad and should be noted, and we can be the one to note it.
        if isinstance(current_tail_hash, NoLogInPeriodError):
            error_log_message = self._build_system_message(
                action=constants.ACTION_LOG_LOGGING_ERROR,
                message=constants.MESSAGE_NO_PREVIOUS_LOG,
            )
            error_log, sign_error = await self._sign_log(error_log_message, "")
            current_tail_hash = error_log.message_hash
            ending_messages.append(error_log)
            # signing errors are swallowed here because log rotation is an automated
            # process during boot that we can't cancel.
            if sign_error:
                ending_messages.append(self._build_sign_error_message(sign_error, None))
                current_tail_hash = ""

        # the actual end message required for log validity
        end_log = self._build_system_message(
            constants.ACTION_LOG_PERIOD_END,
            constants.MESSAGE_LOG_PERIOD_END,
        )
        signed_end_log, sign_error = await self._sign_log(end_log, current_tail_hash)
        # signing errors are swallowed here because log rotation is an automated process
        # during boot that we can't handle.
        if sign_error:
            ending_messages.append(self._build_sign_error_message(sign_error, None))
        ending_messages.append(signed_end_log)
        return self._store.end_period(ending_messages)

    async def _do_rotate_periods(self) -> str:
        """Execute a log period rotation while handling possible error cases."""
        stop_result = await self._stop_period()
        start_messages: list[StoredLog] = []
        start_message = self._build_system_message(
            action=constants.ACTION_LOG_PERIOD_START,
            message=constants.MESSAGE_LOG_PERIOD_START,
        )
        tracking_tail_hash = stop_result if isinstance(stop_result, str) else None
        signed_start, sign_error = await self._sign_log(
            start_message, tracking_tail_hash
        )
        # our start message has to be the first thing in the log, even if there are
        # errors from the previous log
        start_messages.append(signed_start)
        tracking_tail_hash = signed_start.message_hash
        # signing errors are swallowed here because log rotation is an automated process
        # during boot that we can't handle.
        if sign_error:
            sign_error_message = self._build_sign_error_message(
                sign_error, tracking_tail_hash
            )
            start_messages.append(sign_error_message)
            tracking_tail_hash = sign_error_message.message_hash

        # now we can note if this is a start after an unstoppe dperiod
        if isinstance(stop_result, NoActivePeriodError):
            was_no_period_error = self._build_system_message(
                constants.ACTION_LOG_LOGGING_ERROR, constants.MESSAGE_NO_PREVIOUS_PERIOD
            )
            was_no_period_signed, sign_error = await self._sign_log(
                was_no_period_error, tracking_tail_hash
            )
            start_messages.append(was_no_period_signed)
            tracking_tail_hash = was_no_period_signed.message_hash
            # signing errors are swallowed here because log rotation is an automated
            # process during boot that we can't handle.
            if sign_error:
                sign_error_message = self._build_sign_error_message(
                    sign_error, tracking_tail_hash
                )
                start_messages.append(sign_error_message)
                tracking_tail_hash = sign_error_message.message_hash
        return self._store.start_period(start_messages)

    async def _sign_log(
        self, log: str, previous_hash: str | None
    ) -> tuple[StoredLog, Exception | None]:
        """Sign a log message and return it, or a stand-in and an error.

        The caller gets to choose what to do with the error (either raise it or use
        the unsigned message) because maybe the caller is an automated process like
        log rotation and needs to write SOMETHING down, or maybe it's a human and
        needs to reject the action.
        """
        if previous_hash == "":
            previous_hash = None
        try:
            signed_message = await self._key_client.sign_message(
                SignMessageData(message=log, previousHash=previous_hash)
            )
            return (
                StoredLog(
                    message=signed_message.message,
                    message_hash=signed_message.messageHash,
                    message_sig=signed_message.messageSignature,
                    sig_version=str(signed_message.signatureVersion),
                ),
                None,
            )
        except Exception as exc:
            LOG.warning(f"Key-server is unreachable: {exc}")
            return (
                StoredLog(
                    message=log, message_hash="", message_sig="", sig_version="-1"
                ),
                exc,
            )
