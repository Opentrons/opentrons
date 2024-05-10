from httpx import Client, Response, Timeout

from api.settings import Settings


class JSONPlaceholder:
    def __init__(self) -> None:
        self.settings: Settings = Settings()
        self.client = Client(base_url=self.settings.typicode_base_url, timeout=Timeout(connect=5.0, read=10.0, write=10.0, pool=5.0))

    def get_todos(self) -> Response:
        return self.client.get("/todos")
