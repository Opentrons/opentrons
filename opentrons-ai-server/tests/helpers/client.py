import time
from functools import wraps
from typing import Any, Callable, Optional, TypeVar

from api.models.chat_request import ChatRequest, FakeKeys
from api.models.feedback_request import FeedbackRequest
from httpx import Client as HttpxClient
from httpx import HTTPStatusError, Response, Timeout
from rich.console import Console, Group
from rich.panel import Panel
from rich.pretty import Pretty
from rich.prompt import Prompt
from rich.rule import Rule
from rich.text import Text

from tests.helpers.settings import Settings, get_settings
from tests.helpers.token import Token, fetch_user_token

F = TypeVar("F", bound=Callable[..., Any])


def timeit(func: F) -> F:
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        start_time = time.monotonic()
        result = func(*args, **kwargs)
        end_time = time.monotonic()
        elapsed_time = end_time - start_time
        console.print(f"[bold green]{func.__name__} completed in {elapsed_time:.4f} seconds[/bold green]")
        return result

    return wrapper  # type: ignore


console = Console()


class Client:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.token = Token(self.settings)
        self.auth_headers = self.get_auth_headers()
        self.invalid_auth_headers = self.get_auth_headers("bad_token")
        self.unverified_auth_headers, self.unverified_auth_fetch_failed = self._build_unverified_auth_headers()
        self.type_headers = {"Content-Type": "application/json"}
        self.standard_headers = {
            **self.type_headers,
            **self.auth_headers,
        }
        # Read/write allow 5-minute requests (match server request_timeout_seconds) plus buffer
        self.timeout = Timeout(connect=5.0, read=320.0, write=320.0, pool=5.0)
        self.httpx = HttpxClient(base_url=self.settings.BASE_URL, timeout=self.timeout)

    def _build_unverified_auth_headers(self) -> tuple[dict[str, str] | None, bool]:
        """Fetch a user token for the unverified-email test account, if credentials are configured.

        M2M (client_credentials) tokens bypass the email-verification check because they
        are issued to trusted backend services, not human users.  To exercise the
        rejection path we need a *user* token — obtained via the Resource Owner Password
        grant — for a real Auth0 account whose email has not been verified.

        Prerequisites:
        - Password grant must be enabled on the Auth0 application (CLIENT_ID).
        - A test user must exist in the Auth0 dev tenant with email_verified: false.
        - The Auth0 Post-Login Action must be deployed so it injects
          https://opentrons.com/email_verified into user tokens.
        - AND requires that you set the tenant to have a default directory for password grants.

        Set <ENV>_UNVERIFIED_USERNAME and <ENV>_UNVERIFIED_PASSWORD in
        tests/helpers/test.env to enable this in a given environment.

        Returns (headers_or_none, fetch_failed). If the token request fails (e.g. 403
        because Password grant is disabled), returns (None, True) so the test can skip
        with an accurate message; otherwise (None, False) when credentials are not set.
        """
        username: str | None = getattr(self.settings, "UNVERIFIED_USERNAME", None)
        password: str | None = getattr(self.settings, "UNVERIFIED_PASSWORD", None)
        if not username or not password:
            return None, False
        try:
            token = fetch_user_token(
                self.settings.TOKEN_URL,
                self.settings.CLIENT_ID,
                self.settings.SECRET,
                self.settings.AUDIENCE,
                username,
                password,
            )
            return {"Authorization": f"Bearer {token}"}, False
        except HTTPStatusError:
            return None, True

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

    @timeit
    def get_chat_completion(
        self,
        message: str,
        fake: bool = True,
        fake_key: Optional[FakeKeys] = None,
        bad_auth: bool = False,
        unverified_auth: bool = False,
    ) -> Response:
        """Call the /chat/completion endpoint and return the response."""
        request = ChatRequest(
            message=message, fake=fake, fake_key=fake_key, history=None, chat_options=None, pd_protocol_content=None, attachments=None
        )
        if unverified_auth and self.unverified_auth_headers:
            headers = {**self.type_headers, **self.unverified_auth_headers}
        elif bad_auth:
            headers = self.invalid_auth_headers
        else:
            headers = self.standard_headers
        return self.httpx.post("/chat/completion", headers=headers, json=request.model_dump(mode="json"))

    def post_feedback(self, message: str, fake: bool = True, bad_auth: bool = False) -> Response:
        """Call the /chat/feedback endpoint and return the response."""
        request: dict[str, Any] = {"message": message, "fake": fake}
        if message != "":
            request = FeedbackRequest(feedback_text=message, fake=fake).model_dump(by_alias=True)
        headers = self.standard_headers if not bad_auth else self.invalid_auth_headers
        return self.httpx.post("/chat/feedback", headers=headers, json=request)

    def get_bad_endpoint(self, bad_auth: bool = False) -> Response:
        """Call nonexistent endpoint and return the response."""
        headers = self.standard_headers if not bad_auth else self.invalid_auth_headers
        return self.httpx.get(
            "/chat/idontexist",
            headers=headers,
        )

    def get_options(self) -> Response:
        """Call the OPTIONS endpoint and return the response."""
        return self.httpx.options("/chat/completions", headers=self.type_headers)


def print_response(response: Response) -> None:
    """Prints the HTTP response using rich."""
    status_code_text = Text(f"Status code: {response.status_code}", style="bold green")
    try:
        json = response.json()
    except Exception:
        json = None
    if json:
        text = Pretty(json)
    else:
        text = Pretty(response.text)
    url = Pretty(response.request.url)
    # Group the text elements
    panel_content = Group(url, status_code_text, text)
    # Print the panel with grouped content
    console.print(Panel(panel_content, title="Response", expand=False))


def main() -> None:
    env = Prompt.ask("Select environment", choices=["local", "dev", "sandbox", "crt", "staging", "prod"], default="local")
    settings = get_settings(env=env)
    client = Client(settings)
    try:
        console.print(Rule("Getting health endpoint", style="bold"))
        response = client.get_health()
        print_response(response)

        console.print(Rule("Submit feedback", style="bold"))
        feedback_message = Prompt.ask("Enter feedback message")
        response = client.post_feedback(feedback_message, fake=False)
        print_response(response)

        console.print(Rule("Getting chat completion with fake=True and good auth (won't call OpenAI)", style="bold"))
        response = client.get_chat_completion("How do I load a pipette?")
        print_response(response)

        console.print(Rule("Getting chat completion with fake=True and bad auth to show 401 error (won't call OpenAI)", style="bold"))
        response = client.get_chat_completion("How do I load a pipette?", bad_auth=True)
        print_response(response)

        console.print(Rule("Getting OPTIONS", style="bold"))
        response = client.get_options()
        print_response(response)

        console.print(Rule("Now interact", style="bold"))
        real = Prompt.ask("Actually call Anthropic API?", choices=["y", "n"], default="n")
        if real == "y":
            message = Prompt.ask("Enter a message")
            response = client.get_chat_completion(message, fake=False)
            print_response(response)
    finally:
        client.close()


if __name__ == "__main__":
    main()
