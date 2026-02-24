"""Request an unverified-user token from Auth0 and print the response or error.

Use this to debug token fetch failures (e.g. 403 when Password grant is disabled).
Uses the same settings and token helpers as the live test client.

Run from the opentrons-ai-server directory (as a module to avoid stdlib name collision):
  uv run python -m tests.helpers.check_unverified_token
  uv run python -m tests.helpers.check_unverified_token dev
"""

import sys
from typing import Union

from rich.console import Console
from rich.panel import Panel
from rich.pretty import Pretty
from rich.rule import Rule
from rich.table import Table
from rich.text import Text

from tests.helpers.settings import get_settings
from tests.helpers.token import request_user_token

console = Console()


def main() -> None:
    env = (sys.argv[1] if len(sys.argv) > 1 else "local").lower()
    settings = get_settings(env)

    username = getattr(settings, "UNVERIFIED_USERNAME", None)
    password = getattr(settings, "UNVERIFIED_PASSWORD", None)
    if not username or not password:
        console.print(
            f"[red]Unverified credentials not set.[/red] Set {env.upper()}_UNVERIFIED_USERNAME and "
            f"{env.upper()}_UNVERIFIED_PASSWORD in test.env"
        )
        sys.exit(1)

    console.print(Rule("Request", style="bold blue"))
    console.print(
        Panel(
            f"[bold]POST[/bold] {settings.TOKEN_URL}\ngrant_type=password, username={username!r}, audience={settings.AUDIENCE!r}",
            title="Unverified user token",
            border_style="blue",
        )
    )

    response = request_user_token(
        settings.TOKEN_URL,
        settings.CLIENT_ID,
        settings.SECRET,
        settings.AUDIENCE,
        username,
        password,
    )

    status_style = "green" if response.is_success else "red"
    status_text = Text(f"{response.status_code} {response.reason_phrase}", style=status_style)
    console.print(Rule("Response", style="bold blue"))
    console.print(Panel(status_text, title="Status", border_style=status_style))

    headers_table = Table(show_header=True, header_style="bold", box=None)
    headers_table.add_column("Header", style="dim")
    headers_table.add_column("Value", style="dim")
    for name, value in response.headers.items():
        headers_table.add_row(name, value)
    console.print(Panel(headers_table, title="Headers", border_style="blue"))

    try:
        body = response.json()
        body_table = Table(show_header=True, header_style="bold", box=None)
        body_table.add_column("Key", style="cyan")
        body_table.add_column("Value", style="white")
        for k, v in body.items():
            value_cell: Union[str, Pretty]
            if k == "access_token" and isinstance(v, str) and len(v) > 20:
                value_cell = f"{v[:20]}... ({len(v)} chars)"
            else:
                value_cell = Pretty(v)
            body_table.add_row(k, value_cell)
        console.print(Panel(body_table, title="Body (JSON)", border_style="blue"))
    except Exception:
        console.print(Panel(Pretty(response.text), title="Body (raw)", border_style="blue"))

    if not response.is_success:
        sys.exit(1)


if __name__ == "__main__":
    main()
