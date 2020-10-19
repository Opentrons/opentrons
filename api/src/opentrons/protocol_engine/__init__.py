"""
Protocol engine module.

The protocol_engine module contains the logic necessary to take a stream of
protocol commands, issued by some arbitrary protocol runner, and turn it into
robot actions (via `hardware_control`) and protocol state.
"""

from .protocol_engine import ProtocolEngine

__all__ = ["ProtocolEngine"]
