from fastapi.testclient import TestClient


def test_get_logs_redirects(api_client: TestClient) -> None:
    response = api_client.get("/logs/serial.log", follow_redirects=False)
    assert response.status_code == 301
    assert response.headers["location"] == "/system/logs/serial.log"


def test_get_logs_redirects_with_query(api_client: TestClient) -> None:
    response = api_client.get(
        "/logs/api.log?format=json&records=100", follow_redirects=False
    )
    assert response.status_code == 301
    assert (
        response.headers["location"] == "/system/logs/api.log?format=json&records=100"
    )


def post_logs_redirects(api_client: TestClient) -> None:
    response = api_client.post(
        "/settings/log_level/local", follow_redirects=False, json={"log_level": "debug"}
    )
    assert response.status_code == 308
    assert response.headers["location"] == "system/settings/log_level/local"
