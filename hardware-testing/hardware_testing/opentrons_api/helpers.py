"""Opentrons helper methods."""
from types import MethodType
from typing import Any, List

from opentrons import protocol_api, execute, simulate
from opentrons.hardware_control.thread_manager import ThreadManagerException
from opentrons.protocol_api.labware import Well

from .workarounds import is_running_in_app, store_robot_acceleration


def _add_fake_simulate(
    ctx: protocol_api.ProtocolContext, is_simulating: bool
) -> protocol_api.ProtocolContext:
    def _is_simulating(_: protocol_api.ProtocolContext) -> bool:
        return is_simulating

    setattr(ctx, "is_simulating", MethodType(_is_simulating, ctx))
    return ctx


def _add_fake_comment_pause(
    ctx: protocol_api.ProtocolContext,
) -> protocol_api.ProtocolContext:
    def _comment(_: protocol_api.ProtocolContext, a: Any) -> None:
        print(a)

    def _pause(_: protocol_api.ProtocolContext, a: Any) -> None:
        input(a)

    setattr(ctx, "comment", MethodType(_comment, ctx))
    setattr(ctx, "pause", MethodType(_pause, ctx))
    return ctx


def get_api_context(
    api_level: str, is_simulating: bool = False, connect_to_smoothie: bool = True
) -> protocol_api.ProtocolContext:
    """Create an Opentrons API ProtocolContext instance."""
    able_to_execute = False
    ctx = None
    if not is_simulating and connect_to_smoothie:
        try:
            ctx = execute.get_protocol_api(api_level)
            able_to_execute = True
        except ThreadManagerException:
            # Unable to build non-simulated Protocol Context
            # Probably be running on a non-Linux machine
            # Creating simulated Protocol Context, with .is_simulated() overridden
            pass
    if not able_to_execute or is_simulating or not connect_to_smoothie:
        ctx = simulate.get_protocol_api(api_level)
    assert ctx
    if not able_to_execute or not connect_to_smoothie:
        _add_fake_simulate(ctx, is_simulating)
    if not is_running_in_app():
        _add_fake_comment_pause(ctx)
    # NOTE: goshdarnit, all robots will have slower acceleration
    store_robot_acceleration()
    return ctx


def well_is_reservoir(well: protocol_api.labware.Well) -> bool:
    """Well is reservoir."""
    return "reservoir" in well.parent.load_name


def get_list_of_wells_affected(
    pipette: protocol_api.InstrumentContext, well: Well
) -> List[Well]:
    """Get list of wells affected."""
    if pipette.channels > 1 and not well_is_reservoir(well):
        well_col = well.well_name[1:]  # the "1" in "A1"
        wells_list = [w for w in well.parent.columns_by_name()[well_col]]
        assert well in wells_list, "Well is not inside column"
    else:
        wells_list = [well]
    return wells_list


def get_pipette_unique_name(pipette: protocol_api.InstrumentContext) -> str:
    """Get a pipette's unique name."""
    return str(pipette.hw_pipette["pipette_id"])
