#!/usr/bin/env python3
"""Interactively verify a Flex robot encryption key and install its CA for HTTPS.

This mirrors the Opentrons App "Verify robot encryption key" flow for CLI tooling.

Important timing (from key-server API docs):
  1. Open Robot encryption key on the Flex display.
  2. Read the key shown on screen.
  3. Type it here, then the script fetches encrypted certs immediately.
  4. Do NOT fetch /keys/external/ca/encryptedCerts before you have the key.

Usage:
    make verify-robot-encryption ROBOT_IP=192.168.0.20
    uv run python scripts/verify_robot_encryption.py 192.168.0.20

If CA PEM files already exist under e2e-testing/robot-certs/, the script skips
encryption key verification and probes HTTPS with those certs.

Force re-verification:
    uv run python scripts/verify_robot_encryption.py 192.168.0.20 --force

Non-interactive:
    uv run python scripts/verify_robot_encryption.py 192.168.0.20 --password 'alpha-bravo-charlie'
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from rich.console import Console, Group
from rich.panel import Panel
from rich.prompt import Confirm
from rich.text import Text

from automation.clients.keys import DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT, fetch_encrypted_ca_certificates_http
from automation.clients.keys_models import EncryptedCACertificatesData
from automation.robot_certs.paths import E2E_ROBOT_CERTS_DIR
from automation.robot_certs.registry import RobotCertRegistryError, find_by_ip, load_registry
from automation.robot_certs.store import import_legacy_pem_paths, register_robot_ca
from automation.robot_encryption import (
    RobotEncryptionError,
    build_ssl_context_for_robot_cas,
    decrypt_encrypted_ca_certificates,
    format_trusted_ca_paths,
    load_saved_ca_pem_paths,
    probe_robot_https,
    save_robot_ca_certificate,
)

load_dotenv()

console = Console()

STEP_PATH = (
    "Flex touchscreen: Robot Settings → Robot encryption key "
    "(dev builds: enable accessControlMode in app settings first)"
)


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verify a Flex robot encryption key and trust its HTTPS CA.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "The on-screen key rotates every minute or so. Enter the key, then let this "
            "script fetch encrypted certificates right away."
        ),
    )
    parser.add_argument(
        "robot_ip",
        nargs="?",
        default=os.environ.get("ROBOT_IP"),
        help="Robot hostname or IP (or set ROBOT_IP)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("ROBOT_HTTP_PORT", str(DEFAULT_HTTP_PORT))),
        help=f"Robot HTTP API port (default: {DEFAULT_HTTP_PORT})",
    )
    parser.add_argument(
        "--https-port",
        type=int,
        default=int(os.environ.get("ROBOT_HTTPS_PORT", str(DEFAULT_HTTPS_PORT))),
        help=f"Robot HTTPS API port (default: {DEFAULT_HTTPS_PORT})",
    )
    parser.add_argument(
        "--cert-dir",
        type=Path,
        default=Path(os.environ.get("OPENTRONS_ROBOT_CERT_DIR", str(E2E_ROBOT_CERTS_DIR))),
        help=f"Directory for saved CA PEM files (default: {E2E_ROBOT_CERTS_DIR})",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("ROBOT_ENCRYPTION_KEY"),
        help="Encryption key from the robot display (or ROBOT_ENCRYPTION_KEY)",
    )
    parser.add_argument(
        "--skip-https-test",
        action="store_true",
        help="Save CA certs but do not probe GET /health over HTTPS",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-verify the encryption key and replace saved CA certs even if some already exist",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip the 'screen is open' confirmation prompt",
    )
    parser.add_argument(
        "--max-attempts",
        type=int,
        default=3,
        help="How many decrypt attempts before giving up (default: 3)",
    )
    return parser.parse_args(argv)


def _panel(title: str, *parts: Any) -> None:
    content: Any = Group(*parts) if len(parts) > 1 else parts[0]
    console.print(Panel(content, title=title, border_style="cyan", padding=(0, 1)))


def _print_overview(robot_ip: str, http_base: str) -> None:
    _panel(
        "What this script does",
        Text(
            "Trust this Flex robot for HTTPS by decrypting its CA certificate with the "
            "one-time key shown on the robot display (same flow as the Opentrons App)."
        ),
        Text.from_markup(f"Robot HTTP API: [bold]{http_base}[/bold]"),
        Text.from_markup(f"After success, HTTPS API: [bold]https://{robot_ip}:{DEFAULT_HTTPS_PORT}[/bold]"),
    )


def _print_step_by_step() -> None:
    _panel(
        "Steps (order matters)",
        Text(f"1. On the robot: {STEP_PATH}"),
        Text("2. Leave that screen open. The key is three English words like alpha-bravo-charlie."),
        Text("3. When prompted here, type that key exactly (hyphens, no spaces), then press Enter."),
        Text(
            "4. This script immediately calls GET /keys/external/ca/encryptedCerts "
            "and decrypts with the key you just entered."
        ),
        Text(
            "5. If decryption fails, the on-screen key may have rotated. "
            "Use a fresh key and try again without closing the robot screen."
        ),
    )


def _prompt_password(args: argparse.Namespace) -> str:
    if args.password:
        return args.password.strip()

    console.print("[dim]Copy the three words from the Flex display, paste here, press Enter.[/dim]")
    return input("Robot encryption key: ").strip()


def _print_decrypt_failure(err: RobotEncryptionError) -> None:
    parts: list[Any] = [Text(f"[red]{err}[/red]")]
    for line in err.details:
        parts.append(Text(f"• {line}"))
    parts.append(
        Text("Common fixes: open the robot encryption key screen again, wait for a new key, and retry immediately.")
    )
    _panel("Decryption failed", *parts)


async def _fetch_and_decrypt(
    *,
    robot_ip: str,
    http_port: int,
    password: str,
) -> tuple[EncryptedCACertificatesData, list[bytes]] | None:
    console.print("[bold]Fetching encrypted certificates now…[/bold]")
    try:
        encrypted_payload = await fetch_encrypted_ca_certificates_http(robot_ip, http_port=http_port)
    except httpx.HTTPError as err:
        _panel("Fetch failed", Text(f"[red]{type(err).__name__}[/red]: {err}"))
        return None

    has_previous = encrypted_payload.current.previous is not None
    _panel(
        "Fetched encrypted CA certificates",
        Text("GET /keys/external/ca/encryptedCerts succeeded."),
        Text(f"next CA in response: {'yes' if encrypted_payload.next is not None else 'no'}"),
        Text(
            f"previous-password fallback included: {'yes' if has_previous else 'no'} "
            "(if no, the key must match the current on-screen password exactly)"
        ),
    )

    try:
        der_certs = decrypt_encrypted_ca_certificates(password, encrypted_payload)
    except RobotEncryptionError as err:
        _print_decrypt_failure(err)
        return None

    return encrypted_payload, der_certs


def _discover_existing_ca_paths(args: argparse.Namespace) -> list[Path]:
    cert_dir = args.cert_dir.expanduser()
    existing = load_saved_ca_pem_paths(cert_dir)
    if existing:
        return existing

    imported = import_legacy_pem_paths()
    if imported:
        _panel(
            "Imported Opentrons App CA certificate(s)",
            Text("Copied PEM files from APP_CERT_DIR into robot-certs/."),
            *[Text(str(path)) for path in imported],
        )
        return imported

    return []


async def _ensure_registry(args: argparse.Namespace, trusted_ca_paths: list[Path]) -> None:
    registry = load_registry()
    if find_by_ip(registry, args.robot_ip) is not None:
        return
    try:
        entry = await register_robot_ca(
            robot_ip=args.robot_ip,
            ca_pem_paths=trusted_ca_paths,
            http_port=args.port,
            https_port=args.https_port,
        )
    except RobotCertRegistryError as err:
        _panel(
            "Registry not updated",
            Text(f"[yellow]{err}[/yellow]"),
            Text("HTTPS clients should use AuthClient(robot_ip) after fixing registry."),
        )
        return

    _panel(
        "Updated robot-certs/registry.yaml",
        Text(f"robot_serial: {entry.robot_serial}"),
        Text(f"ip: {entry.ip}"),
        Text(f"ca_cert: {entry.ca_cert}"),
        Text(f"robot_name: {entry.robot_name or '(unknown)'}"),
    )


async def _run_https_probe(
    args: argparse.Namespace,
    trusted_ca_paths: list[Path],
) -> int:
    if args.skip_https_test:
        console.print(
            "[dim]Skipped HTTPS probe (--skip-https-test). "
            f"Use saved CAs from {args.cert_dir.expanduser()} for future HTTPS clients.[/dim]"
        )
        return 0

    try:
        ssl_context = build_ssl_context_for_robot_cas(trusted_ca_paths)
    except RobotEncryptionError as err:
        _panel("HTTPS setup failed", Text(f"[red]{err}[/red]"))
        return 1

    _panel(
        "HTTPS probe (using saved CA trust)",
        Text(f"URL: https://{args.robot_ip}:{args.https_port}/health"),
        Text("Trusted CA file(s):"),
        *[Text(f"  {path}") for path in format_trusted_ca_paths(trusted_ca_paths)],
    )

    try:
        response = await probe_robot_https(
            robot_ip=args.robot_ip,
            port=args.https_port,
            ssl_context=ssl_context,
        )
    except httpx.HTTPStatusError as err:
        parts: list[Any] = [
            Text(f"[red]HTTP {err.response.status_code}[/red]: {err.request.method} {err.request.url}"),
        ]
        if err.response is not None:
            parts.append(
                Text("[green]TLS succeeded[/green]: the robot accepted the saved CA and returned an HTTP response.")
            )
            body = (err.response.text or "")[:300]
            if body:
                parts.append(Text(f"Response body: {body}"))
        _panel("HTTPS probe failed", *parts)
        return 1
    except httpx.RequestError as err:
        _panel(
            "HTTPS probe failed (TLS or network)",
            Text(f"[red]{type(err).__name__}[/red]: {err}"),
            Text("The saved CA was not accepted, or the robot is unreachable on the HTTPS port."),
            *[Text(f"  {path}") for path in format_trusted_ca_paths(trusted_ca_paths)],
        )
        return 1

    _panel(
        "HTTPS verified",
        Text(f"GET https://{args.robot_ip}:{args.https_port}/health -> HTTP {response.status_code}"),
        Text("Trusted CA file(s):"),
        *[Text(f"  {path}") for path in format_trusted_ca_paths(trusted_ca_paths)],
        Text(
            "You can now use HTTPS against this robot from Python (httpx verify=ssl context) "
            "or point other tools at the saved PEM files."
        ),
    )
    return 0


async def _install_certs_from_encryption_key(args: argparse.Namespace) -> list[Path] | None:
    http_base = f"http://{args.robot_ip}:{args.port}".rstrip("/")
    cert_dir = args.cert_dir.expanduser()

    _print_overview(args.robot_ip, http_base)
    _print_step_by_step()

    if not args.yes:
        if not Confirm.ask(
            "Is the Robot encryption key screen open on the Flex right now?",
            default=True,
        ):
            console.print(f"[yellow]Open it first:[/yellow] {STEP_PATH}")
            return None

    attempt = 0
    der_certs: list[bytes] | None = None
    while attempt < args.max_attempts and der_certs is None:
        attempt += 1
        if attempt > 1:
            console.print()
            _panel(
                f"Retry {attempt} of {args.max_attempts}",
                Text("Use the current key on the Flex display (it may have rotated)."),
            )
            if not args.yes and not Confirm.ask(
                "Is the Robot encryption key screen still open?",
                default=True,
            ):
                console.print("[yellow]Aborted.[/yellow]")
                return None

        password = _prompt_password(args)
        if not password:
            console.print("[red]error:[/red] encryption key cannot be empty")
            return None

        result = await _fetch_and_decrypt(
            robot_ip=args.robot_ip,
            http_port=args.port,
            password=password,
        )
        if result is None:
            if attempt >= args.max_attempts:
                return None
            if not Confirm.ask("Try again with a fresh on-screen key?", default=True):
                return None
            args.password = None
            continue
        _, der_certs = result

    if der_certs is None:
        return None

    saved_paths: list[Path] = []
    for der in der_certs:
        saved_paths.append(save_robot_ca_certificate(der, cert_dir))

    _panel(
        "Saved robot CA certificate(s)",
        Text(f"Directory: {cert_dir}"),
        *[Text(str(path)) for path in saved_paths],
    )
    return saved_paths


async def _verify(args: argparse.Namespace) -> int:
    if not args.robot_ip:
        console.print("[red]error:[/red] provide robot_ip or set ROBOT_IP in the environment or .env")
        return 2

    cert_dir = args.cert_dir.expanduser()
    existing_ca_paths = _discover_existing_ca_paths(args)
    should_install = args.force or args.password is not None or not existing_ca_paths

    if not should_install:
        _panel(
            "Using existing CA certificate(s)",
            Text(f"Directory: {cert_dir}"),
            Text("Skipping encryption key verification (certs already saved)."),
            Text("Use --force to re-verify the on-screen key and replace saved certs."),
            *[Text(str(path)) for path in existing_ca_paths],
        )
        await _ensure_registry(args, existing_ca_paths)
        return await _run_https_probe(args, existing_ca_paths)

    if existing_ca_paths and args.force:
        _panel(
            "Replacing saved CA certificate(s)",
            Text("--force set; re-verifying encryption key and overwriting saved certs."),
            *[Text(str(path)) for path in existing_ca_paths],
        )

    saved_paths = await _install_certs_from_encryption_key(args)
    if saved_paths is None:
        return 1

    try:
        entry = await register_robot_ca(
            robot_ip=args.robot_ip,
            ca_pem_paths=saved_paths,
            http_port=args.port,
            https_port=args.https_port,
        )
    except RobotCertRegistryError as err:
        _panel("Registry update failed", Text(f"[red]{err}[/red]"))
        return 1

    _panel(
        "Updated robot-certs/registry.yaml",
        Text(f"robot_serial: {entry.robot_serial}"),
        Text(f"ip: {entry.ip}"),
        Text(f"ca_cert: {entry.ca_cert}"),
    )

    return await _run_https_probe(args, saved_paths)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    console.print(
        Panel(
            Text.from_markup("[bold]Verify Flex robot encryption key[/bold] (install HTTPS CA trust)"),
            border_style="blue",
        )
    )
    return asyncio.run(_verify(args))


if __name__ == "__main__":
    raise SystemExit(main())
