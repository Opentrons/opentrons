from httpx import Response

from api.integration.http_client import HTTPClient


class JSONPlaceholder:
    def __init__(self) -> None:
        self.client = HTTPClient("https://jsonplaceholder.typicode.com")

    def get_todos(self) -> Response:
        return self.client.sync_request("GET", "/todos")
