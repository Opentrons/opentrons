from datetime import datetime
from typing import Tuple
import json
import urllib.request
import time
import platform

from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api import InstrumentContext, ProtocolContext


def is_running_in_app() -> bool:
    return False  # FIXME: how to detect if we are running in the App?


def is_running_on_robot() -> bool:
    return str(platform.system()).lower() == 'linux'


def apply_additional_offset_to_labware(labware: Labware, x=0, y=0, z=0):
    # NOTE: this will re-instantiate all the labware's WELLs
    #       so this must be ran before rest of protocol
    labware_imp = labware._implementation
    labware_delta = labware.calibrated_offset - labware_imp.get_geometry().offset
    labware.set_offset(
        x=labware_delta.x + x,
        y=labware_delta.y + y,
        z=labware_delta.z + z
    )


def force_prepare_for_aspirate(pipette: InstrumentContext) -> None:
    # FIXME: remove this and use latest API version once available
    # NOTE: this MUST happen before the .move_to()
    #       because the API automatically moves the pipette
    #       to well.top() before beginning the .aspirate()
    pipette.aspirate(pipette.min_volume)
    pipette.dispense()


def load_newest_offset_for_labware(ctx: ProtocolContext, labware: Labware) -> Tuple[float, float, float]:
    if ctx.is_simulating() or not is_running_on_robot():
        return 0, 0, 0

    # FIXME: .urlopen() is slow
    runs_response = urllib.request.urlopen('http://localhost:31950/runs')
    runs_response_data = runs_response.read()
    runs_json = json.loads(runs_response_data)

    lw_uri = str(labware.uri)
    lw_slot = str(labware.parent)

    protocols_list = runs_json['data']
    lw_offsets = [
        offset
        for p in protocols_list
        for offset in p['labwareOffsets']
        if offset['definitionUri'] == lw_uri and
        offset['location']['slotName'] == lw_slot
    ]

    def _sort_by_created_at(_offset) -> datetime:
        return datetime.fromisoformat(_offset['createdAt'])

    lw_offsets.sort(key=_sort_by_created_at)
    v = lw_offsets[-1]['vector']
    return round(v['x'], 2), round(v['y'], 2), round(v['z'], 2)
