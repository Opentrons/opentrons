from httpx import Response

from api.integration.http_client import HTTPClient
from api.settings import Settings

settings: Settings = Settings()


class JSONPlaceholder:
    def __init__(self) -> None:
        self.client = HTTPClient(settings.typicode_base_url)

    def get_todos(self) -> Response:
        return self.client.sync_request("GET", "/todos")
