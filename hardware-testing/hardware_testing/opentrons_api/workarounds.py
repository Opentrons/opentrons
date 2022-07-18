"""Opentrons API Workarounds."""
from datetime import datetime
from typing import Tuple, List
import json
from urllib.request import Request, urlopen
import platform

from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api import InstrumentContext, ProtocolContext


def is_running_in_app() -> bool:
    """Is running in App."""
    return False  # FIXME: how to detect if we are running in the App?


def is_running_on_robot() -> bool:
    """Is running on Robot."""
    return str(platform.system()).lower() == "linux"


def apply_additional_offset_to_labware(
    labware: Labware, x: float = 0.0, y: float = 0.0, z: float = 0.0
) -> None:
    """Apply additional offset to labware."""
    # NOTE: this will re-instantiate all the labware's WELLs
    #       so this must be ran before rest of protocol
    labware_imp = labware._implementation
    labware_delta = labware.calibrated_offset - labware_imp.get_geometry().offset
    labware.set_offset(
        x=labware_delta.x + x, y=labware_delta.y + y, z=labware_delta.z + z
    )


def force_prepare_for_aspirate(pipette: InstrumentContext) -> None:
    """Force prepare for aspirate."""
    # FIXME: remove this and use latest API version once available
    # NOTE: this MUST happen before the .move_to()
    #       because the API automatically moves the pipette
    #       to well.top() before beginning the .aspirate()
    pipette.aspirate(pipette.min_volume)
    pipette.dispense()


def http_get_all_labware_offsets(ctx: ProtocolContext) -> List[dict]:
    """Request (HTTP GET) from the local robot-server all runs information."""
    if ctx.is_simulating() or not is_running_on_robot():
        return []

    req = Request("http://localhost:31950/runs")
    req.add_header("Opentrons-Version", "2")
    runs_response = urlopen(req)
    runs_response_data = runs_response.read()
    runs_json = json.loads(runs_response_data)

    protocols_list = runs_json["data"]
    return [offset for p in protocols_list for offset in p["labwareOffsets"]]


def get_latest_offset_for_labware(
    labware_offsets: List[dict], labware: Labware
) -> Tuple[float, float, float]:
    """Get latest offset for labware."""
    lw_uri = str(labware.uri)
    lw_slot = str(labware.parent)

    lw_offsets = [
        offset
        for offset in labware_offsets
        if offset["definitionUri"] == lw_uri
        and offset["location"]["slotName"] == lw_slot
    ]

    if not lw_offsets:
        return 0.0, 0.0, 0.0

    def _sort_by_created_at(_offset: dict) -> datetime:
        return datetime.fromisoformat(_offset["createdAt"])

    lw_offsets.sort(key=_sort_by_created_at)
    v = lw_offsets[-1]["vector"]
    return round(v["x"], 2), round(v["y"], 2), round(v["z"], 2)
