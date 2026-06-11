#!/usr/bin/env python3
"""Render demo-user access-control test cases as an HTML report.

Usage:
    uv run python scripts/print_demo_access_matrix.py
    make demo-access-matrix
"""

from __future__ import annotations

import argparse
import html
import http.server
import signal
import socket
import socketserver
import sys
import threading
from datetime import UTC, datetime
from functools import partial
from pathlib import Path

from automation.demo_access_matrix import (
    HTTP_ACCESS_CASES,
    LOGIN_SCOPE_CASES,
    TOKEN_ONLY_SCOPE_CASES,
)

_DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "test-results" / "demo-access-matrix.html"
_DEFAULT_HOST = "127.0.0.1"
_DEFAULT_PORT = 8765
_PORT_SCAN_ATTEMPTS = 20
_SERVE_POLL_INTERVAL = 0.2


class _ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def _stop_http_server(
    httpd: _ReusableTCPServer,
    server_thread: threading.Thread,
    *,
    join_timeout: float = 5.0,
) -> None:
    if server_thread.is_alive():
        httpd.shutdown()
        server_thread.join(timeout=join_timeout)
    httpd.server_close()


def _expectation_badge(expectation: str) -> str:
    css_class = "allow" if expectation == "allow" else "forbid"
    return f'<span class="badge {css_class}">{html.escape(expectation)}</span>'


def _row_start(account_type: str) -> str:
    return f'<tr class="row-{html.escape(account_type)}">'


def _legend_items() -> str:
    items = (
        ("user", "user (operator)"),
        ("auditor", "auditor"),
        ("service", "service"),
    )
    return "\n".join(
        f'<span class="legend-item"><span class="legend-swatch row-{account_type}"></span>'
        f"<code>{html.escape(label)}</code></span>"
        for account_type, label in items
    )


def _http_rows() -> str:
    rows: list[str] = []
    for case in HTTP_ACCESS_CASES:
        endpoint = html.escape(f"{case.method} {case.path}")
        rows.append(
            _row_start(case.account_type) + f"<td><code>{html.escape(case.account_type)}</code></td>"
            f"<td><code>{endpoint}</code></td>"
            f"<td><code>{html.escape(case.scope)}</code></td>"
            f"<td>{_expectation_badge(case.expectation)}</td>"
            f"<td>{html.escape(case.description)}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def _login_rows() -> str:
    rows: list[str] = []
    for case in LOGIN_SCOPE_CASES:
        rows.append(
            _row_start(case.account_type) + f"<td><code>{html.escape(case.account_type)}</code></td>"
            f"<td><code>{html.escape(case.requested_scope)}</code></td>"
            f"<td>{_expectation_badge(case.expectation)}</td>"
            f"<td>{html.escape(case.description)}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def _token_only_rows() -> str:
    rows: list[str] = []
    for case in TOKEN_ONLY_SCOPE_CASES:
        rows.append(
            _row_start(case.account_type) + f"<td><code>{html.escape(case.account_type)}</code></td>"
            f"<td><code>{html.escape(case.scope)}</code></td>"
            f"<td>{html.escape(case.description)}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def render_html() -> str:
    generated_at = datetime.now(tz=UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    http_count = len(HTTP_ACCESS_CASES)
    login_count = len(LOGIN_SCOPE_CASES)
    token_count = len(TOKEN_ONLY_SCOPE_CASES)
    total = http_count + login_count + token_count

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Demo user access-control matrix</title>
  <script>
    (function () {{
      var stored = localStorage.getItem("demo-access-matrix-theme");
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var theme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
    }})();
  </script>
  <style>
    :root,
    html[data-theme="light"] {{
      color-scheme: light;
      --bg: #f7f7f8;
      --surface: #ffffff;
      --text: #16212d;
      --muted: #5c6670;
      --border: #d8dee4;
      --allow-bg: #e6f4ea;
      --allow-text: #1e7e34;
      --forbid-bg: #fdecea;
      --forbid-text: #b42318;
      --accent: #006cfa;
      --row-user-bg: #b8dcff;
      --row-auditor-bg: #ffe066;
      --row-service-bg: #d4b5ff;
      --toggle-bg: #ffffff;
      --toggle-active-bg: #006cfa;
      --toggle-active-text: #ffffff;
    }}
    html[data-theme="dark"] {{
      color-scheme: dark;
      --bg: #0f1419;
      --surface: #1a222c;
      --text: #e8edf2;
      --muted: #9aa7b5;
      --border: #2d3a47;
      --allow-bg: #12301f;
      --allow-text: #7dcea0;
      --forbid-bg: #3a1714;
      --forbid-text: #f5a8a0;
      --accent: #4da3ff;
      --row-user-bg: #1f4f99;
      --row-auditor-bg: #8a6508;
      --row-service-bg: #5a3d9e;
      --toggle-bg: #1a222c;
      --toggle-active-bg: #4da3ff;
      --toggle-active-text: #0f1419;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: "Inter", "Segoe UI", system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }}
    main {{
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem 3rem;
    }}
    .page-header {{
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem 1.5rem;
      margin-bottom: 2rem;
    }}
    .page-header-copy {{
      flex: 1 1 20rem;
    }}
    h1 {{
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
    }}
    .meta {{
      color: var(--muted);
      margin: 0;
    }}
    .theme-toggle {{
      display: inline-flex;
      padding: 0.2rem;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--toggle-bg);
    }}
    .theme-toggle button {{
      border: none;
      background: transparent;
      color: var(--text);
      font: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      cursor: pointer;
    }}
    .theme-toggle button:hover {{
      color: var(--accent);
    }}
    .theme-toggle button.is-active {{
      background: var(--toggle-active-bg);
      color: var(--toggle-active-text);
    }}
    .theme-toggle button.is-active:hover {{
      color: var(--toggle-active-text);
    }}
    .summary {{
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
    }}
    .summary-card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      min-width: 10rem;
    }}
    .summary-card strong {{
      display: block;
      font-size: 1.5rem;
      color: var(--accent);
    }}
    .legend {{
      display: flex;
      flex-wrap: wrap;
      gap: 1rem 1.5rem;
      margin-bottom: 2rem;
      padding: 0.85rem 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
    }}
    .legend-item {{
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }}
    .legend-swatch {{
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border-radius: 4px;
      border: 1px solid var(--border);
    }}
    .legend-swatch.row-user {{ background: var(--row-user-bg); }}
    .legend-swatch.row-auditor {{ background: var(--row-auditor-bg); }}
    .legend-swatch.row-service {{ background: var(--row-service-bg); }}
    section {{
      margin-bottom: 2.5rem;
    }}
    h2 {{
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
    }}
    .table-wrap {{
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.925rem;
    }}
    th, td {{
      padding: 0.65rem 0.85rem;
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid var(--border);
    }}
    th {{
      background: color-mix(in srgb, var(--surface) 85%, var(--accent));
      font-weight: 600;
      white-space: nowrap;
    }}
    tr:last-child td {{ border-bottom: none; }}
    tr.row-user td {{ background: var(--row-user-bg); }}
    tr.row-auditor td {{ background: var(--row-auditor-bg); }}
    tr.row-service td {{ background: var(--row-service-bg); }}
    code {{
      font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
      font-size: 0.85em;
    }}
    .badge {{
      display: inline-block;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }}
    .badge.allow {{
      background: var(--allow-bg);
      color: var(--allow-text);
    }}
    .badge.forbid {{
      background: var(--forbid-bg);
      color: var(--forbid-text);
    }}
  </style>
</head>
<body>
  <main>
    <div class="page-header">
      <div class="page-header-copy">
        <h1>Demo user access-control matrix</h1>
        <p class="meta">Generated {generated_at}. Source: <code>automation/demo_access_matrix.py</code></p>
      </div>
      <div class="theme-toggle" role="group" aria-label="Color theme">
        <button type="button" data-theme-choice="light">Light</button>
        <button type="button" data-theme-choice="dark">Dark</button>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card"><strong>{total}</strong> total cases</div>
      <div class="summary-card"><strong>{http_count}</strong> HTTPS probes</div>
      <div class="summary-card"><strong>{login_count}</strong> login scope cases</div>
      <div class="summary-card"><strong>{token_count}</strong> token-only scopes</div>
    </div>

    <div class="legend" aria-label="User type colors">
      {_legend_items()}
    </div>

    <section>
      <h2>HTTPS endpoint probes</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User type</th>
              <th>Endpoint</th>
              <th>Scope</th>
              <th>Expectation</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {_http_rows()}
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Login scope requests</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User type</th>
              <th>Requested scope</th>
              <th>Expectation</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {_login_rows()}
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Token-only scopes (no HTTP probe)</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User type</th>
              <th>Scope</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {_token_only_rows()}
          </tbody>
        </table>
      </div>
    </section>
  </main>
  <script>
    (function () {{
      var storageKey = "demo-access-matrix-theme";
      var buttons = document.querySelectorAll("[data-theme-choice]");

      function setTheme(theme) {{
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(storageKey, theme);
        buttons.forEach(function (button) {{
          button.classList.toggle("is-active", button.dataset.themeChoice === theme);
        }});
      }}

      buttons.forEach(function (button) {{
        button.addEventListener("click", function () {{
          setTheme(button.dataset.themeChoice);
        }});
      }});

      setTheme(document.documentElement.dataset.theme || "light");
    }})();
  </script>
</body>
</html>
"""


def write_html_report(output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_html(), encoding="utf-8")
    return output_path


def find_available_port(host: str, preferred_port: int) -> tuple[int, bool]:
    """Return a bindable port, starting at preferred_port."""

    for offset in range(_PORT_SCAN_ATTEMPTS):
        port = preferred_port + offset
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((host, port))
            except OSError:
                continue
            return port, offset == 0

    raise RuntimeError(f"No available port in range {preferred_port}-{preferred_port + _PORT_SCAN_ATTEMPTS - 1}")


def serve_html_report(output_path: Path, host: str, preferred_port: int) -> None:
    port, used_preferred = find_available_port(host, preferred_port)
    url = f"http://{host}:{port}/{output_path.name}"
    print(f"Serving demo access matrix at {url} (Ctrl+C to stop)", flush=True)
    if not used_preferred:
        print(f"Port {preferred_port} was in use; using {port} instead.", flush=True)

    handler = partial(
        http.server.SimpleHTTPRequestHandler,
        directory=str(output_path.parent),
    )
    httpd = _ReusableTCPServer((host, port), handler)
    stop_requested = threading.Event()

    def _serve_until_shutdown() -> None:
        httpd.serve_forever(poll_interval=_SERVE_POLL_INTERVAL)

    server_thread = threading.Thread(
        target=_serve_until_shutdown,
        name="demo-access-matrix-http",
        daemon=False,
    )

    def _request_shutdown(signum: int, frame: object | None) -> None:
        del signum, frame
        stop_requested.set()
        httpd.shutdown()

    prior_sigterm = signal.getsignal(signal.SIGTERM)
    signal.signal(signal.SIGTERM, _request_shutdown)

    server_thread.start()
    try:
        while server_thread.is_alive() and not stop_requested.is_set():
            server_thread.join(timeout=_SERVE_POLL_INTERVAL)
    except KeyboardInterrupt:
        stop_requested.set()
    finally:
        _stop_http_server(httpd, server_thread)
        signal.signal(signal.SIGTERM, prior_sigterm)

    print("Stopped.", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=_DEFAULT_OUTPUT,
        help=f"HTML output path (default: {_DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Serve the generated HTML report over HTTP until interrupted.",
    )
    parser.add_argument(
        "--host",
        default=_DEFAULT_HOST,
        help=f"Host to bind when serving (default: {_DEFAULT_HOST})",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=_DEFAULT_PORT,
        help=f"Preferred port when serving (default: {_DEFAULT_PORT})",
    )
    args = parser.parse_args()
    output_path = write_html_report(args.output.resolve())
    print(output_path)
    if args.serve:
        serve_html_report(output_path, args.host, args.port)


if __name__ == "__main__":
    main()
    sys.exit(0)
