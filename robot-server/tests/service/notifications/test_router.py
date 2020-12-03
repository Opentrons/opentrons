import json

import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect


def test_subscribe(api_client: TestClient):
    """Test that a connection can be established."""
    socket = api_client.websocket_connect(
        "/notifications/subscribe?topic=a&topic=b&topic=c"
    )
    s = socket.receive()
    assert json.loads(s['text']) == {
        "status": "subscribed",
        "topics": ["a", "b", "c"]
    }


def test_subscribe_no_topic(api_client: TestClient):
    """Test that query string must contain topic list."""
    with pytest.raises(WebSocketDisconnect):
        api_client.websocket_connect(
            "/notifications/subscribe"
        )
