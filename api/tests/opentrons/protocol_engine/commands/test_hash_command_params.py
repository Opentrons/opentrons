"""Tests for hash_command_params."""

from opentrons.protocol_engine import CommandIntent
from opentrons.protocol_engine import commands
from opentrons.protocol_engine.commands.hash_command_params import hash_command_params


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

    assert hash_command_params(b, None) == hash_command_params(c, None)

    a_hash = hash_command_params(a, None)
    assert hash_command_params(b, a_hash) == hash_command_params(c, a_hash)


def test_nonequivalent_commands() -> None:
    """Nonequivalent commands should have different hashes."""
    a = commands.BlowOutInPlaceCreate(
        params=commands.BlowOutInPlaceParams(
            pipetteId="abc123",
            flowRate=123,
        )
    )
    b = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123)
    )

    assert hash_command_params(a, None) != hash_command_params(b, None)


def test_repeated_commands() -> None:
    """Repeated commands should hash differently, even though they're equivalent in isolation."""
    a = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123)
    )
    b = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123)
    )

    a_hash = hash_command_params(a, None)
    b_hash = hash_command_params(b, a_hash)
    assert a_hash != b_hash


def test_setup_command() -> None:
    """Setup commands should always hash to None."""
    setup_command = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=123),
        intent=CommandIntent.SETUP,
    )
    assert hash_command_params(setup_command, None) is None
