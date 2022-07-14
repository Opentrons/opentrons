from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api import InstrumentContext


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
