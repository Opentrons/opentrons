"""Unit tests for the `/audit/internal/logMessage` route."""

from __future__ import annotations

import json
from typing import Any, cast

import fastapi
import pytest
from decoy import Decoy
from opentrons_shared_data.errors.exceptions import KeyStorageUnavailableError

from server_utils.auth.resource_server.types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
)
from server_utils.fastapi_utils.models.json_api import RequestModel

from .. import LogPayloadMatcher, RecentTimestampMatcher
from audit_server.log_ingest.models import (
    SubmitAuditLogMessageData,
    SubmitExternalAuditLogMessageData,
)
from audit_server.log_ingest.router import post_external_log_message, post_log_message
from audit_server.log_storage.log_data_manager import LogDataManager


async def test_full_request_body_forwarded_to_ldm(
    decoy: Decoy, mock_log_data_manager: LogDataManager
) -> None:
    """The full request body must be sent to the log data manager with a server timestamp."""
    log_data = SubmitAuditLogMessageData(
        action="run.start",
        accountName="alice",
        legalName="Alice Anderson",
        message="Started run abc-123",
        reason="Routine experiment",
    )
    decoy.when(
        await mock_log_data_manager.store_log(
            cast(
                Any,
                LogPayloadMatcher(message=log_data, loggedAt=RecentTimestampMatcher()),
            )
        )
    ).then_return("")
    response = await post_log_message(
        RequestModel(data=log_data), log_data_manager=mock_log_data_manager
    )

    assert response.status_code == 201


async def test_full_request_body_forwarded_with_null_reason(
    mock_log_data_manager: LogDataManager, decoy: Decoy
) -> None:
    """The full request body must be sent to the log data manager with a server timestamp."""
    log_data = SubmitAuditLogMessageData(
        action="run.start",
        accountName="alice",
        legalName="Alice Anderson",
        message="Started run abc-123",
        reason=None,
    )

    def _null_reason_not_dropped(message_str: str) -> bool:
        message_data = json.loads(message_str)
        assert message_data["reason"] is None
        return True

    decoy.when(
        await mock_log_data_manager.store_log(
            cast(
                Any,
                LogPayloadMatcher(
                    message=log_data,
                    loggedAt=RecentTimestampMatcher(),
                    extra=_null_reason_not_dropped,
                ),
            )
        )
    ).then_return("")

    response = await post_log_message(
        RequestModel(data=log_data), log_data_manager=mock_log_data_manager
    )

    assert response.status_code == 201


async def test_non_ascii_utf8_message_forwarded_verbatim(
    mock_log_data_manager: LogDataManager, decoy: Decoy
) -> None:
    """Non-ASCII characters that round-trip cleanly through UTF-8 must reach
    the log data manager with their code points intact."""
    # Includes Latin diacritics, CJK ideographs, a zero-width joiner emoji
    # sequence, and a high-plane emoji to cover BMP + supplementary planes.
    non_ascii_message = "Démarrage du protocole №1: 实验开始 — 🧬👩‍🔬🚀 (β=½)"
    log_data = SubmitAuditLogMessageData(
        action="run.start",
        accountName="élise",
        legalName="Élise Müller-中野",
        message=non_ascii_message,
        reason="experimentación",
    )

    def _test_utf8_stuff(log_message: str) -> bool:
        forwarded_payload = json.loads(log_message)
        assert forwarded_payload["message"] == non_ascii_message
        assert forwarded_payload["accountName"] == "élise"
        assert forwarded_payload["legalName"] == "Élise Müller-中野"
        assert forwarded_payload["reason"] == "experimentación"
        # The serialized JSON we pass to the key-server must itself round-trip
        # losslessly through UTF-8, since the key-server hashes UTF-8 bytes.
        assert log_message.encode("utf-8").decode("utf-8") == log_message
        assert non_ascii_message in log_message
        return True

    decoy.when(
        await mock_log_data_manager.store_log(
            cast(
                Any,
                LogPayloadMatcher(
                    message=log_data,
                    loggedAt=RecentTimestampMatcher(),
                    extra=_test_utf8_stuff,
                ),
            )
        )
    )

    response = await post_log_message(
        RequestModel(data=log_data), log_data_manager=mock_log_data_manager
    )

    assert response.status_code == 201


async def test_returns_503_when_key_server_unavailable(
    mock_log_data_manager: LogDataManager, decoy: Decoy
) -> None:
    """If the key-server cannot be contacted, the endpoint must return a
    well-formed HTTP 503 instead of crashing with a 500."""
    log_data = SubmitAuditLogMessageData(
        action="run.start",
        accountName="alice",
        legalName="Alice Anderson",
        message="Started run abc-123",
        reason=None,
    )
    decoy.when(
        await mock_log_data_manager.store_log(
            cast(
                Any,
                LogPayloadMatcher(message=log_data, loggedAt=RecentTimestampMatcher()),
            )
        )
    ).then_raise(KeyStorageUnavailableError("oh no"))

    def _check(exc: BaseException) -> bool:
        if not isinstance(exc, fastapi.HTTPException):
            return False
        if exc.status_code != 503:
            return False
        return True

    with pytest.raises(check=_check):
        await post_log_message(
            RequestModel(data=log_data), log_data_manager=mock_log_data_manager
        )


async def test_raises_if_authentication_is_not_required(
    mock_log_data_manager: LogDataManager,
) -> None:
    """If CRS mode is disabled, the endpoint must raise a 418."""
    with pytest.raises(fastapi.HTTPException) as exc_info:
        await post_external_log_message(
            RequestModel(
                data=SubmitExternalAuditLogMessageData(action="test", message="test")
            ),
            log_data_manager=mock_log_data_manager,
            user_notes="test",
            authentication=AuthenticationNotRequiredResult(),
        )
    assert exc_info.value.status_code == 418
    assert (
        exc_info.value.detail
        == "Audit log is not available while Compliance Ready Software is inactive."
    )


async def test_forwards_data_if_authentication_is_required(
    mock_log_data_manager: LogDataManager, decoy: Decoy
) -> None:
    """If CRS mode is enabled, the endpoint must forward the data to the log data manager."""
    decoy.when(
        await mock_log_data_manager.store_log(
            cast(
                Any,
                LogPayloadMatcher(
                    message=SubmitAuditLogMessageData(
                        action="External-test-action",
                        message="our message",
                        reason="our reason",
                        accountName="testusername",
                        legalName="Test User",
                    ),
                    loggedAt=RecentTimestampMatcher(),
                ),
            )
        )
    ).then_return("")
    response = await post_external_log_message(
        RequestModel(
            data=SubmitExternalAuditLogMessageData(
                action="test-action", message="our message"
            )
        ),
        log_data_manager=mock_log_data_manager,
        user_notes="our reason",
        authentication=AuthenticatedResult(
            username="testusername", fullname="Test User", scope="audit_log.write"
        ),
    )
    assert response.status_code == 201
