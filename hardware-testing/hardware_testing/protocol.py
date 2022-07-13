from dataclasses import dataclass

from opentrons import protocol_api
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.instrument_context import InstrumentContext

metadata = {'apiLevel': '2.12'}
PIP_SIZE = 300  # change to either 20, 300, or 1000


@dataclass
class PhotometricLabwareSlots:
    plate: str
    tiprack: str
    tiprack_multi: str
    trough: str
    vial: str


@dataclass
class PhotometricProtocolItems:
    plate: Labware
    tiprack: Labware
    tiprack_multi: Labware
    trough: Labware
    vial: Labware
    pipette: InstrumentContext
    multi: InstrumentContext


DEFAULT_LABWARE_SLOTS = PhotometricLabwareSlots(
    tiprack='8',
    tiprack_multi='7',
    vial='6',
    plate='2',
    trough='5'
)


def load_labware_and_pipettes(protocol: protocol_api.ProtocolContext, vial_def=None) -> PhotometricProtocolItems:
    tiprack = protocol.load_labware(f'opentrons_96_tiprack_{PIP_SIZE}ul',
                                    location=DEFAULT_LABWARE_SLOTS.tiprack)
    tiprack_multi = protocol.load_labware(f'opentrons_96_tiprack_300ul',
                                          location=DEFAULT_LABWARE_SLOTS.tiprack_multi)
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat',
                                  location=DEFAULT_LABWARE_SLOTS.plate)
    trough = protocol.load_labware('nest_12_reservoir_15ml',
                                   location=DEFAULT_LABWARE_SLOTS.trough)
    if vial_def:
        vial = protocol.load_labware_from_definition(vial_def,
                                                     location=DEFAULT_LABWARE_SLOTS.vial)
    else:
        vial = protocol.load_labware('radwag_pipette_calibration_vial',
                                     location=DEFAULT_LABWARE_SLOTS.vial)
    pipette = protocol.load_instrument(f'p{PIP_SIZE}_single_gen2', 'left',
                                       tip_racks=[tiprack])
    multi = protocol.load_instrument(f'p300_multi_gen2', 'right',
                                     tip_racks=[tiprack_multi])
    return PhotometricProtocolItems(
        plate=plate, tiprack=tiprack, tiprack_multi=tiprack_multi, trough=trough, vial=vial,
        pipette=pipette, multi=multi
    )


def apply_calibrated_labware_offsets(items: PhotometricProtocolItems) -> None:
    # TODO: load these values automatically
    items.tiprack.set_offset(x=-0.40, y=6.90, z=1.00)
    items.tiprack_multi.set_offset(x=0.70, y=1.10, z=0.00)
    items.plate.set_offset(x=136.00, y=105.40, z=-6.50)
    items.trough.set_offset(x=0.00, y=0.00, z=0.00)
    items.vial.set_offset(x=-4.00, y=-14.20, z=-39.30)
