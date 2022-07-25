"""Hardware Testing support package."""
from types import MethodType
from typing import Any

from opentrons import protocol_api, execute, simulate
from opentrons.hardware_control.thread_manager import ThreadManagerException


def get_api_context(
    api_level: str, is_simulating: bool = False
) -> protocol_api.ProtocolContext:
    """Create an Opentrons API ProtocolContext instance."""
    if is_simulating:
        ctx = simulate.get_protocol_api(api_level)
    else:
        try:
            ctx = execute.get_protocol_api(api_level)
        except ThreadManagerException:
            # Unable to build non-simulated Protocol Context
            # Probably be running on a non-Linux machine
            # Creating simulated Protocol Context, with .is_simulated() overridden
            ctx = simulate.get_protocol_api(api_level)

            def _fake_context_is_simulating(_: Any) -> bool:
                return False

            setattr(ctx, "is_simulating", MethodType(_fake_context_is_simulating, ctx))
    return ctx
