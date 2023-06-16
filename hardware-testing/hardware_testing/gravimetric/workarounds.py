"""Opentrons API Workarounds."""
from datetime import datetime
from urllib.request import Request, urlopen
from typing import List
import platform
from json import loads as json_loads

from opentrons.hardware_control import SyncHardwareAPI
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api import InstrumentContext, ProtocolContext

from hardware_testing.opentrons_api.helpers_ot3 import start_server_ot3, stop_server_ot3
from hardware_testing.opentrons_api.types import Point


def is_running_in_app() -> bool:
    """Is running in App."""
    return False  # FIXME: how to detect if we are running in the App?


def is_running_on_robot() -> bool:
    """Is running on Robot."""
    return str(platform.system()).lower() == "linux"


def force_prepare_for_aspirate(pipette: InstrumentContext) -> None:
    """Force prepare for aspirate."""
    # FIXME: remove this and use latest API version once available
    # NOTE: this MUST happen before the .move_to()
    #       because the API automatically moves the pipette
    #       to well.top() before beginning the .aspirate()
    pipette.aspirate(pipette.min_volume)
    pipette.dispense()


def http_get_all_labware_offsets() -> List[dict]:
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
    return [offset for p in protocols_list for offset in p["labwareOffsets"]]


def _old_slot_to_ot3_slot(old_api_slot: str) -> str:
    conversion_dict = {
        "1": "D1",
        "2": "D2",
        "3": "D3",
        "4": "C1",
        "5": "C2",
        "6": "C3",
        "7": "B1",
        "8": "B2",
        "9": "B3",
        "10": "A1",
        "11": "A2",
        "12": "A3",
    }
    return conversion_dict[old_api_slot]


def get_latest_offset_for_labware(
    labware_offsets: List[dict], labware: Labware
) -> Point:
    """Get latest offset for labware."""
    lw_uri = str(labware.uri)
    lw_slot = _old_slot_to_ot3_slot(str(labware.parent))

    def _is_offset_present(_o: dict) -> bool:
        _v = _o["vector"]
        return _v["x"] != 0 or _v["y"] != 0 or _v["z"] != 0

    def _offset_applies_to_labware(_o: dict) -> bool:
        if _o["definitionUri"] != lw_uri:
            return False
        if _o["location"]["slotName"] != lw_slot:
            return False
        return _is_offset_present(_o)

    lw_offsets = [
        offset for offset in labware_offsets if _offset_applies_to_labware(offset)
    ]

    if not lw_offsets:
        return Point()

    def _sort_by_created_at(_offset: dict) -> datetime:
        return datetime.fromisoformat(_offset["createdAt"])

    lw_offsets.sort(key=_sort_by_created_at)
    v = lw_offsets[-1]["vector"]
    return Point(x=v["x"], y=v["y"], z=v["z"])


def get_sync_hw_api(ctx: ProtocolContext) -> SyncHardwareAPI:
    """Get HW API."""
    return ctx._core.get_hardware()
