# noqa: D100


from fastapi import FastAPI, Response
from starlette.testclient import TestClient

from server_utils.fastapi_utils.server_timing_middleware import server_timing_middleware


def test_server_timing_middleware() -> None:
    """Test server timing middleware.

    It should add, or update, a Server-Timing header with the elapsed milliseconds.
    """
    app = FastAPI()

    class TestClock:
        """Start at t=100 seconds and increment by 1 second each call."""

        def __init__(self) -> None:
            self._time = 100.0

        def __call__(self) -> float:
            initial_time = self._time
            self._time += 1
            return initial_time

    app.middleware("http")(server_timing_middleware(TestClock()))

    @app.get("/testEndpoint")
    def get_test_endpoint() -> str:
        return "Test response body"

    @app.get("/testEndpointWithPreexistingHeader")
    def get_test_endpoint_with_preexisting_header(response: Response) -> str:
        response.headers["Server-Timing"] = "something-preexisting"
        return "Test response body"

    test_client = TestClient(app)

    response = test_client.get("/testEndpoint")
    assert response.status_code == 200
    assert (
        response.headers["Server-Timing"]
        == 'opentrons-asgi;dur=1000;desc="Time in Python (roughly)"'
    )

    response = test_client.get("/testEndpointWithPreexistingHeader")
    assert response.status_code == 200
    assert (
        response.headers["Server-Timing"]
        == 'something-preexisting,opentrons-asgi;dur=1000;desc="Time in Python (roughly)"'
    )
