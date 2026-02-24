import json
import time
from dataclasses import dataclass, field
from functools import wraps
from typing import Any, Callable, Iterator, Optional, TypeVar

from api.models.chat_request import ChatRequest, FakeKeys
from api.models.feedback_request import FeedbackRequest
from httpx import Client as HttpxClient
from httpx import Response, Timeout
from rich.console import Console, Group
from rich.live import Live
from rich.panel import Panel
from rich.pretty import Pretty
from rich.prompt import Prompt
from rich.rule import Rule
from rich.text import Text

from tests.helpers.settings import Settings, get_settings
from tests.helpers.token import Token

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


@dataclass
class SseResult:
    """Collected result from a streaming SSE endpoint."""

    status_code: int
    headers: dict[str, str]
    events: list[dict[str, Any]] = field(default_factory=list)


def iter_sse_events(lines: Iterator[str]) -> Iterator[dict[str, Any]]:
    """Yield parsed SSE event payloads from a line iterator (e.g. httpx stream.iter_lines()).

    Skips blank lines and non-data lines; silently drops malformed JSON.
    """
    for line in lines:
        if not line.startswith("data: "):
            continue
        payload_str = line[6:].strip()
        if not payload_str:
            continue
        try:
            yield json.loads(payload_str)
        except json.JSONDecodeError:
            continue


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
        # Read/write allow 5-minute streaming (match server request_timeout_seconds) plus buffer
        self.timeout = Timeout(connect=5.0, read=320.0, write=320.0, pool=5.0)
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

    @timeit
    def get_chat_completion(self, message: str, fake: bool = True, fake_key: Optional[FakeKeys] = None, bad_auth: bool = False) -> Response:
        """Call the /chat/completion endpoint and return the response."""
        request = ChatRequest(
            message=message, fake=fake, fake_key=fake_key, history=None, chat_options=None, pd_protocol_content=None, attachments=None
        )
        headers = self.standard_headers if not bad_auth else self.invalid_auth_headers
        return self.httpx.post("/chat/completion", headers=headers, json=request.model_dump(mode="json"))

    def post_feedback(self, message: str, fake: bool = True, bad_auth: bool = False) -> Response:
        """Call the /chat/feedback endpoint and return the response."""
        request: dict[str, Any] = {"message": message, "fake": fake}
        if message != "":
            request = FeedbackRequest(feedbackText=message, fake=fake).model_dump()
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

    def post_update_protocol_stream(self, body: dict[str, Any], bad_auth: bool = False) -> SseResult:
        """Stream /chat/updateProtocol/stream; collect and return all SSE events."""
        headers = self.standard_headers if not bad_auth else self.invalid_auth_headers
        with self.httpx.stream("POST", "/chat/updateProtocol/stream", headers=headers, json=body) as r:
            events = list(iter_sse_events(r.iter_lines()))
        return SseResult(status_code=r.status_code, headers=dict(r.headers), events=events)

    def post_create_protocol_stream(self, body: dict[str, Any], bad_auth: bool = False) -> SseResult:
        """Stream /chat/createProtocol/stream; collect and return all SSE events."""
        headers = self.standard_headers if not bad_auth else self.invalid_auth_headers
        with self.httpx.stream("POST", "/chat/createProtocol/stream", headers=headers, json=body) as r:
            events = list(iter_sse_events(r.iter_lines()))
        return SseResult(status_code=r.status_code, headers=dict(r.headers), events=events)

    def post_completion_stream(self, body: dict[str, Any], bad_auth: bool = False) -> SseResult:
        """Stream /chat/completion/stream; collect and return all SSE events."""
        headers = self.standard_headers if not bad_auth else self.invalid_auth_headers
        with self.httpx.stream("POST", "/chat/completion/stream", headers=headers, json=body) as r:
            events = list(iter_sse_events(r.iter_lines()))
        return SseResult(status_code=r.status_code, headers=dict(r.headers), events=events)

    def post_completion_multipart_stream(
        self,
        message: str = "Hello",
        history: str = "[]",
        fake: bool = True,
        fake_key: Optional[str] = None,
        protocol_format: str = "python",
        bad_auth: bool = False,
        file_uploads: Optional[list[tuple[str, bytes]]] = None,
    ) -> SseResult:
        """Stream /chat/completion-multipart/stream with form fields and optional files; return all SSE events.

        file_uploads: list of (filename, content) for the current message. Filenames must be
        msgN_originalname (e.g. msg0_doc.txt) so the server maps them to the message index.
        """
        headers = self.standard_headers if not bad_auth else self.invalid_auth_headers
        headers = {k: v for k, v in headers.items() if k.lower() != "content-type"}
        form: list[tuple[str, tuple[Any, Any]]] = [
            ("message", (None, message)),
            ("history", (None, history)),
            ("fake", (None, str(fake).lower())),
            ("protocol_format", (None, protocol_format)),
        ]
        if fake_key is not None:
            form.append(("fake_key", (None, fake_key)))
        if file_uploads:
            for filename, content in file_uploads:
                form.append(("files", (filename, content)))
        with self.httpx.stream("POST", "/chat/completion-multipart/stream", headers=headers, files=form) as r:
            events = list(iter_sse_events(r.iter_lines()))
        return SseResult(status_code=r.status_code, headers=dict(r.headers), events=events)


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

        console.print(Rule("Stream updateProtocol (fake, live)", style="bold"))
        body = {
            "prompt": "Add a step",
            "protocol_text": "def run(protocol): pass",
            "regenerate": False,
            "update_type": "other",
            "update_details": "add step",
            "fake": True,
            "fake_key": "streaming_3s",
        }
        headers = {k: v for k, v in client.standard_headers.items() if k.lower() != "content-type"}
        headers["Content-Type"] = "application/json"
        accumulated = Text()
        with Live(
            Panel(accumulated, title="[bold cyan]updateProtocol/stream[/bold cyan]", border_style="cyan"),
            console=console,
            refresh_per_second=15,
        ) as live:
            with client.httpx.stream("POST", "/chat/updateProtocol/stream", headers=headers, json=body) as stream_resp:
                live.update(
                    Panel(
                        accumulated,
                        title=f"[bold cyan]updateProtocol/stream[/bold cyan] — {stream_resp.status_code}",
                        border_style="cyan",
                    )
                )
                for evt in iter_sse_events(stream_resp.iter_lines()):
                    if "delta" in evt:
                        accumulated.append(evt["delta"])
                        live.update(
                            Panel(
                                accumulated,
                                title=f"[bold cyan]updateProtocol/stream[/bold cyan] — {stream_resp.status_code}",
                                border_style="cyan",
                            )
                        )

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
