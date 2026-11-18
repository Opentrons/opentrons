"""Test the terminal bootstrap entrypoint without a CAN bus."""

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

from hardware_testing.drivers import provision_pipette_manual as manual


SERIAL = "P2HHV3220261107A03"
BLANK = "ff" * 20


def test_prompt_serial_retries_until_a_valid_production_serial(
    monkeypatch,
) -> None:
    """Manual entry validates the serial before opening CAN."""
    monkeypatch.setattr("builtins.input", Mock(side_effect=["bad", SERIAL]))

    assert manual._prompt_serial() == SERIAL


def test_provision_reads_snapshot_then_writes_with_that_snapshot(monkeypatch) -> None:
    """The bootstrap write is bound to the identity read before confirmation."""

    class AsyncContext:
        async def __aenter__(self):
            return object()

        async def __aexit__(self, *args):
            return None

    inspect_result = {
        "success": True,
        "before": {"serial": None, "raw_hex": BLANK},
    }
    write_result = {"success": True, "status": "success"}
    provision = AsyncMock(side_effect=[inspect_result, write_result])
    monkeypatch.setattr(manual.worker, "provision", provision)
    monkeypatch.setattr(manual.build, "driver", Mock(return_value=AsyncContext()))
    monkeypatch.setattr(manual, "CanMessenger", Mock(return_value=AsyncContext()))
    monkeypatch.setattr(manual, "build_settings", Mock(return_value=object()))
    monkeypatch.setattr(manual, "_confirm", Mock(return_value=True))

    args = SimpleNamespace(
        which="left",
        yes=False,
        attempts=3,
        timeout=1.0,
        interface="socketcan",
        channel="can0",
    )

    assert asyncio.run(manual._provision(args, SERIAL)) == 0
    assert provision.await_args_list[1].kwargs["expected_before_hex"] == BLANK
    assert provision.await_args_list[1].kwargs["requested_serial"] == SERIAL
