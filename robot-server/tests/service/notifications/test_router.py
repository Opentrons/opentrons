from mock import patch

import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from robot_server.service.notifications import handle_subscriber


def test_subscribe(api_client: TestClient):
    """Test that a connection can be established and topics discovered."""
    with patch.object(handle_subscriber, "handle_socket") as m:
        api_client.websocket_connect(
            "/notifications/subscribe?topic=a&topic=b&topic=c"
        )
        m.assert_called_once()
        assert m.call_args[0][1] == ["a", "b", "c"]


def test_subscribe_no_topic(api_client: TestClient):
    """Test that query string must contain topic list."""
    with pytest.raises(WebSocketDisconnect):
        api_client.websocket_connect(
            "/notifications/subscribe"
        )
