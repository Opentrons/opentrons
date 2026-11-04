"""Opentrons API Workarounds."""
from datetime import datetime
from urllib.request import Request, urlopen
from typing import List
from json import loads as json_loads
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api import ProtocolContext

from hardware_testing.opentrons_api.helpers_ot3 import start_server_ot3, stop_server_ot3
from opentrons.types import Point

from opentrons.protocol_engine.types import LabwareOffset


def http_get_all_labware_offsets() -> List[LabwareOffset]:
    """Request (HTTP GET) from the local robot-server all runs information."""
    req = Request("http://localhost:31950/runs")
    req.add_header("Opentrons-Version", "2")

    # temporarily start the server, so we can read from it
    start_server_ot3()
    runs_response = urlopen(req)
    runs_response_data = runs_response.read()
    stop_server_ot3()

    runs_json = json_loads(runs_response_data)
    protocols_list = runs_json["data"]
    offset_dict = [offset for p in protocols_list for offset in p["labwareOffsets"]]
    offsets: List[LabwareOffset] = []
    for offset_data in offset_dict:
        new_offset = LabwareOffset(
            id=offset_data["id"],
            createdAt=offset_data["createdAt"],
            definitionUri=offset_data["definitionUri"],
            location=offset_data["location"],
            vector=offset_data["vector"],
        )
        offsets.append(new_offset)
    return offsets


def get_latest_offset_for_labware(
    labware_offsets: List[LabwareOffset], labware: Labware
) -> Point:
    """Get latest offset for labware."""
    lw_uri = str(labware.uri)

    def _is_offset_present(_o: LabwareOffset) -> bool:
        _v = _o.vector
        return _v.x != 0 or _v.y != 0 or _v.z != 0

    def _offset_applies_to_labware(_o: LabwareOffset) -> bool:
        if _o.location.slotName.value != labware.parent:
            return False
        offset_uri = _o.definitionUri
        if offset_uri[0:-1] != lw_uri[0:-1]:  # drop schema version number
            # ui.print_info(f"{_o} does not apply {offset_uri} != {lw_uri}")
            # NOTE: we're allowing tip-rack adapters to share offsets
            #       because it doesn't make a difference which volume
            #       of tip it holds
            o_is_adp = "custom_beta" in offset_uri and "_adp" in offset_uri
            l_is_adp = "custom_beta" in lw_uri and "_adp" in lw_uri
            if not o_is_adp or not l_is_adp:
                return False
        return _is_offset_present(_o)

    lw_offsets = [
        offset for offset in labware_offsets if _offset_applies_to_labware(offset)
    ]
    if not lw_offsets:
        return Point()

    def _sort_by_created_at(_offset: LabwareOffset) -> datetime:
        return _offset.createdAt

    lw_offsets.sort(key=_sort_by_created_at)
    v = lw_offsets[-1].vector
    return Point(x=v.x, y=v.y, z=v.z)


def get_sync_hw_api(ctx: ProtocolContext) -> SyncHardwareAPI:
    """Get HW API."""
    return ctx._core.get_hardware()
