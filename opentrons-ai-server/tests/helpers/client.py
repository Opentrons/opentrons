from api.models.chat_request import ChatRequest
from httpx import Client as HttpxClient
from httpx import Response, Timeout
from rich import inspect
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt

from tests.helpers.settings import Settings, get_settings
from tests.helpers.token import Token


class Client:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.token = Token(self.settings)
        self.auth_headers = self.get_auth_headers()
        self.invalid_auth_headers = self.get_auth_headers("bad_token")
        self.type_headers = {"Content-Type": "application/json"}
        self.standard_headers = {
            **self.type_headers,
            **self.auth_headers,
        }
        self.timeout = Timeout(connect=5.0, read=120.0, write=120.0, pool=5.0)
        self.httpx = HttpxClient(base_url=self.settings.BASE_URL, timeout=self.timeout)

    def close(self) -> None:
        """Closes the HTTPX client instance."""
        self.httpx.close()

    def get_auth_headers(self, token_override: str | None = None) -> dict[str, str]:
        if token_override:
            return {"Authorization": f"Bearer {token_override}"}
        return {"Authorization": f"Bearer {self.token.value}"}

    def get_health(self) -> Response:
        """Call the /health endpoint and return the response."""
        return self.httpx.get("/health", headers=self.type_headers)

    def get_chat_completion(self, message: str, fake: bool = True, bad_auth: bool = False) -> Response:
        """Call the /chat/completion endpoint and return the response."""
        request = ChatRequest(message=message, fake=fake)
        headers = self.standard_headers if not bad_auth else self.invalid_auth_headers
        return self.httpx.post("/chat/completion", headers=headers, json=request.model_dump())

    def get_bad_endpoint(self, bad_auth: bool = False) -> Response:
        """Call nonexistent endpoint and return the response."""
        headers = self.standard_headers if not bad_auth else self.invalid_auth_headers
        return self.httpx.get(
            "/chat/idontexist",
            headers=headers,
        )


def print_response(response: Response) -> None:
    """Prints the HTTP response using rich."""
    console = Console()
    console.print(Panel("Response", expand=False))
    inspect(response)


def main() -> None:
    console = Console()
    env = Prompt.ask("Select environment", choices=["dev", "sandbox", "crt"], default="sandbox")
    settings = get_settings(env=env)
    client = Client(settings)
    try:
        console.print(Panel("Getting health endpoint", expand=False))
        response = client.get_health()
        print_response(response)

        console.print(Panel("Getting chat completion with fake=True and good auth (won't call OpenAI)", expand=False))
        response = client.get_chat_completion("How do I load a pipette?")
        print_response(response)

        console.print(Panel("Getting chat completion with fake=True and bad auth to show 401 error (won't call OpenAI)", expand=False))
        response = client.get_chat_completion("How do I load a pipette?", bad_auth=True)
        print_response(response)

        real = Prompt.ask("Actually call OpenAI API?", choices=["y", "n"], default="n")
        if real == "y":
            message = Prompt.ask("Enter a message")
            response = client.get_chat_completion(message, fake=False)
            print_response(response)
    finally:
        client.close()


if __name__ == "__main__":
    main()
