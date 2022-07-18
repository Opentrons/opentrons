"""Opentrons helper methods."""
from types import MethodType
from typing import Any, List

from opentrons import protocol_api, execute, simulate
from opentrons.protocol_api.labware import Well, Labware
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


def well_is_reservoir(well: protocol_api.labware.Well) -> bool:
    return "reservoir" in well.parent.load_name


def get_list_of_wells_affected(
    pipette: protocol_api.InstrumentContext, well: Well
) -> List[Well]:
    if pipette.channels > 1 and not well_is_reservoir(well):
        well_col = well.well_name[1:]  # the "1" in "A1"
        wells_list = [w for w in well.parent.columns_by_name()[well_col]]
        assert well in wells_list, "Well is not inside column"
    else:
        wells_list = [well]
    return wells_list
