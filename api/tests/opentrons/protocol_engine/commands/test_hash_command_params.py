"""Tests for hash_command_params."""

import pytest

from opentrons.protocol_engine import CommandIntent, commands
from opentrons.protocol_engine.commands.hash_command_params import (
    hash_protocol_command_params,
)


def test_equivalent_commands() -> None:
    """Equivalent commands should have the same hash."""
    a = commands.BlowOutInPlaceCreate(
        params=commands.BlowOutInPlaceParams(
            pipetteId="abc123",
            flowRate=123,
        )
    )
    b = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123)
    )
    c = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123)
    )

    assert hash_protocol_command_params(b, None) == hash_protocol_command_params(
        c, None
    )

    a_hash = hash_protocol_command_params(a, None)
    assert hash_protocol_command_params(b, a_hash) == hash_protocol_command_params(
        c, a_hash
    )


def test_nonequivalent_commands() -> None:
    """Nonequivalent commands should have different hashes."""
    a = commands.BlowOutInPlaceCreate(
        params=commands.BlowOutInPlaceParams(
            pipetteId="abc123",
            flowRate=123,
        ),
        intent=CommandIntent.PROTOCOL,
    )
    b = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123)
    )

    assert hash_protocol_command_params(a, None) != hash_protocol_command_params(
        b, None
    )


def test_repeated_commands() -> None:
    """Repeated commands should hash differently, even though they're equivalent in isolation."""
    a = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123),
        intent=CommandIntent.PROTOCOL,
    )
    b = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123),
        intent=CommandIntent.PROTOCOL,
    )

    a_hash = hash_protocol_command_params(a, None)
    b_hash = hash_protocol_command_params(b, a_hash)
    assert a_hash != b_hash


@pytest.mark.parametrize("command_intent", [CommandIntent.SETUP, CommandIntent.FIXIT])
def test_setup_and_fixit_command(command_intent: CommandIntent) -> None:
    """Setup and fixit commands should always skip hashing."""
    setup_command = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123),
        intent=command_intent,
    )
    assert hash_protocol_command_params(setup_command, None) is None
