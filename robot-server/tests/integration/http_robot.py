from pathlib import Path
from typing import List
from requests import Session, Response
from requests.exceptions import ConnectionError
from requests.structures import CaseInsensitiveDict


from tests.integration.utils import wait_until


class HttpRobot:
    """HTTP-API client for a robot."""

    def __init__(
        self,
        host: str = "localhost",
        port: str = "31950",
        version: str = "*",
    ) -> None:
        """Initialize the client."""
        self.session: Session = Session()
        self.session.headers = CaseInsensitiveDict({"Opentrons-Version": version})
        self.base_url: str = f"{host}:{port}"

    def alive(self) -> bool:
        """Are the /heath and /openapi.json both reachable?"""
        try:
            self.get_health()
            self.get_openapi()
            return True
        except ConnectionError:
            return False

    def wait_until_alive(self, timeout_sec: float) -> bool:
        """Retry the /heath and /openapi.json until both reachable."""
        return wait_until(self.alive, True, timeout_sec)

    def wait_until_dead(self, timeout_sec: float) -> bool:
        """Retry the /heath and /openapi.json until both unreachable."""
        return wait_until(self.alive, False, timeout_sec)

    def get_health(self) -> Response:
        """GET /health."""
        endpoint = f"{self.base_url}/health"
        return self.session.get(endpoint)

    def get_openapi(self) -> Response:
        """GET /openapi.json."""
        endpoint = f"{self.base_url}/openapi.json"
        return self.session.get(endpoint)

    def get_protocols(self) -> Response:
        """GET /protocols."""
        endpoint = f"{self.base_url}/protocols"
        return self.session.get(endpoint)

    def post_protocol(self, files: List[Path]) -> Response:
        """POST /protocols."""
        file_payload = []
        for file in files:
            file_payload.append(("files", open(file, "rb")))
        endpoint = f"{self.base_url}/protocols"
        return self.session.post(endpoint, files=file_payload)

    def delete_run(self, run_id: str) -> Response:
        """DELETE /runs/{id}."""
        endpoint = f"{self.base_url}/runs/{run_id}"
        return self.session.delete(endpoint)
