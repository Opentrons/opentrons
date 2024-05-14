import pytest

from tests.helpers.client import Client


@pytest.mark.live
def test_get_health(client: Client) -> None:
    """Test to verify the health endpoint of the API."""
    response = client.get_health()
    assert response.status_code == 200, "Health endpoint should return HTTP 200"


@pytest.mark.live
def test_get_chat_completion_good_auth(client: Client) -> None:
    """Test the chat completion endpoint with good authentication."""
    response = client.get_chat_completion("How do I load tipracks for my 8 channel pipette on an OT2?", fake=True)
    assert response.status_code == 200, "Chat completion with good auth should return HTTP 200"


@pytest.mark.live
def test_get_chat_completion_bad_auth(client: Client) -> None:
    """Test the chat completion endpoint with bad authentication."""
    # This call never reaches the lambda function, the API Gateway rejects it
    response = client.get_chat_completion("How do I load a pipette?", bad_auth=True)
    assert response.status_code == 401, "Chat completion with bad auth should return HTTP 401"


@pytest.mark.live
def test_get_bad_endpoint_with_good_auth(client: Client) -> None:
    """Test a nonexistent endpoint with good authentication."""
    response = client.get_bad_endpoint()
    assert response.status_code == 404, "nonexistent endpoint with good auth should return HTTP 404"


@pytest.mark.live
def test_get_bad_endpoint_with_bad_auth(client: Client) -> None:
    """Test a nonexistent endpoint with bad authentication."""
    response = client.get_bad_endpoint(bad_auth=True)
    assert response.status_code == 401, "nonexistent endpoint with bad auth should return HTTP 401"
