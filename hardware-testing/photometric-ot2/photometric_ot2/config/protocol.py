# NOTE: do not import anything from this project

from dataclasses import dataclass

from opentrons import protocol_api
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.instrument_context import InstrumentContext

metadata = {'apiLevel': '2.12'}


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


def load_labware_and_pipettes(protocol: protocol_api.ProtocolContext,
                              vial_def=None, pip_mount='left', multi_mount='right',
                              pip_size=300, multi_size=300) -> PhotometricProtocolItems:
    tiprack = protocol.load_labware(f'opentrons_96_tiprack_{pip_size}ul',
                                    location=DEFAULT_LABWARE_SLOTS.tiprack)
    tiprack_multi = protocol.load_labware(f'opentrons_96_tiprack_{multi_size}ul',
                                          location=DEFAULT_LABWARE_SLOTS.tiprack_multi)
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat',
                                  location=DEFAULT_LABWARE_SLOTS.plate)
    trough = protocol.load_labware('nest_12_reservoir_15ml',
                                   location=DEFAULT_LABWARE_SLOTS.trough)
    vial = None
    # if vial_def:
    #     vial = protocol.load_labware_from_definition(vial_def,
    #                                                  location=DEFAULT_LABWARE_SLOTS.vial)
    # else:
    #     vial = protocol.load_labware('radwag_pipette_calibration_vial',
    #                                  location=DEFAULT_LABWARE_SLOTS.vial)
    pipette = None
    if pip_mount:
        pipette = protocol.load_instrument(f'p{pip_size}_single_gen2', pip_mount,
                                           tip_racks=[tiprack])
    multi = None
    if multi_mount:
        multi = protocol.load_instrument(f'p{multi_size}_multi_gen2', multi_mount,
                                         tip_racks=[tiprack_multi])
    return PhotometricProtocolItems(
        plate=plate, tiprack=tiprack, tiprack_multi=tiprack_multi, trough=trough, vial=vial,
        pipette=pipette, multi=multi
    )


def run(protocol: protocol_api.ProtocolContext) -> None:
    protocol_items = load_labware_and_pipettes(
        protocol,
        pip_mount='left', pip_size=300,
        multi_mount=None, multi_size=300)
    protocol_items.pipette.transfer(
        protocol_items.pipette.min_volume,
        protocol_items.trough['A1'],
        protocol_items.plate['A1'])
    protocol_items.pipette.transfer(
        protocol_items.pipette.min_volume,
        protocol_items.vial['A1'],
        protocol_items.vial['A1'])
    if protocol_items.multi:
        protocol_items.multi.transfer(
            protocol_items.multi.min_volume,
            protocol_items.trough['A1'],
            protocol_items.plate['A1'])
