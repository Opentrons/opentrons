from typing import Tuple
from pathlib import Path
import json

from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api import InstrumentContext


def is_running_in_app() -> bool:
    return False  # FIXME: how to detect if we are running in the App?


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


def load_newest_offset_for_labware(name: str, slot: str) -> Tuple[float, float, float]:
    # TODO: read from /runs, which returns a JSON dict
    # Note: for testing right now, just read from the example output file
    with open(Path(__file__).parent / 'example_runs_output.json') as f:
        runs = json.load(f)
    protocols_list = runs['data']
    for p in protocols_list:
        print(f'Protocol: {p["id"]}')
        labware_offsets = p['labwareOffsets']
        for offset in labware_offsets:
            print(f'\tOffset URI: {offset["definitionUri"]}')
            print(f'\t\tCreated at: {offset["createdAt"]}')
            print(f'\t\tLocation: {offset["location"]}')
            print(f'\t\tVector: {offset["vector"]}')
    return 0, 0, 0
