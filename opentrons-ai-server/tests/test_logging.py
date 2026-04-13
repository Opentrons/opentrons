"""Unit tests for custom logging behavior: flatten_extra and user_id in context."""

import pytest
import structlog
from api.handler.custom_logging import flatten_extra_into_event


@pytest.mark.unit
def test_flatten_extra_into_event_merges_extra_to_top_level() -> None:
    """Extra dict is merged into the event so all fields appear in the same log line."""
    event_dict: dict[str, object] = {
        "event": "POST /api/chat/completion",
        "request_id": "abc-123",
        "extra": {"user_id": "auth0|6442dc9453847944d3508a8b", "num_files": 2},
    }
    result = flatten_extra_into_event(None, None, event_dict)

    assert "extra" not in result
    assert result["user_id"] == "auth0|6442dc9453847944d3508a8b"
    assert result["num_files"] == 2
    assert result["request_id"] == "abc-123"
    assert result["event"] == "POST /api/chat/completion"


@pytest.mark.unit
def test_flatten_extra_into_event_does_not_overwrite_existing_keys() -> None:
    """Existing top-level keys are preserved; extra does not overwrite them."""
    event_dict: dict[str, object] = {
        "event": "msg",
        "user_id": "from_context",
        "extra": {"user_id": "from_extra", "other": "value"},
    }
    result = flatten_extra_into_event(None, None, event_dict)

    assert result["user_id"] == "from_context"
    assert result["other"] == "value"
    assert "extra" not in result


@pytest.mark.unit
def test_flatten_extra_into_event_ignores_non_dict_extra() -> None:
    """If 'extra' is not a dict, the event dict is unchanged (no KeyError)."""
    event_dict: dict[str, object] = {"event": "msg", "extra": "not a dict"}
    result = flatten_extra_into_event(None, None, event_dict)

    assert result["extra"] == "not a dict"
    assert result["event"] == "msg"


@pytest.mark.unit
def test_flatten_extra_into_event_no_extra_key() -> None:
    """If there is no 'extra' key, the event dict is unchanged."""
    event_dict: dict[str, object] = {"event": "msg", "request_id": "xyz"}
    result = flatten_extra_into_event(None, None, event_dict)

    assert result == {"event": "msg", "request_id": "xyz"}


@pytest.mark.unit
def test_flatten_extra_into_event_empty_extra() -> None:
    """Empty extra dict is removed and no keys are added."""
    event_dict: dict[str, object] = {"event": "msg", "extra": {}}
    result = flatten_extra_into_event(None, None, event_dict)

    assert "extra" not in result
    assert result["event"] == "msg"


@pytest.mark.unit
def test_context_and_extra_both_at_top_level_after_processor_chain() -> None:
    """Context vars (e.g. user_id) and extra end up in the same event dict at top level."""
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id="req-456", user_id="auth0|user123")

    try:
        # Simulate event_dict after merge_contextvars + ExtraAdder: context merged in,
        # and stdlib added an "extra" dict for kwargs passed to log.info("msg", extra={...})
        event_dict: dict[str, object] = {
            "event": "POST /api/chat/completion-multipart",
            "request_id": "req-456",
            "user_id": "auth0|user123",
            "extra": {"num_files": 3},
        }
        result = flatten_extra_into_event(None, None, event_dict)

        assert "extra" not in result
        assert result["user_id"] == "auth0|user123"
        assert result["request_id"] == "req-456"
        assert result["num_files"] == 3
        assert result["event"] == "POST /api/chat/completion-multipart"
    finally:
        structlog.contextvars.clear_contextvars()
