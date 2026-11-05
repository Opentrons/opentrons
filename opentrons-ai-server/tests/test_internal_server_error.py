from unittest.mock import patch

import pytest
from api.handler.http_errors import internal_server_http_exception
from api.models.internal_server_error import InternalServerError


@pytest.mark.unit
def test_internal_server_error_default_payload_omits_exception_details() -> None:
    payload = InternalServerError().model_dump(by_alias=True)
    assert payload == {"message": "Internal server error", "errorType": "InternalServerError"}
    assert "exceptionMessage" not in payload
    assert "traceback" not in payload


@pytest.mark.unit
def test_internal_server_http_exception_logs_traceback_not_in_response() -> None:
    with patch("api.handler.http_errors.logger.exception") as mock_exception:
        try:
            raise ValueError("sensitive internal detail")
        except ValueError:
            http_exc = internal_server_http_exception("test failure")

        mock_exception.assert_called_once_with("test failure")
        assert http_exc.status_code == 500
        detail = http_exc.detail
        assert isinstance(detail, dict)
        assert detail.get("message") == "Internal server error"
        assert "sensitive internal detail" not in str(detail)
