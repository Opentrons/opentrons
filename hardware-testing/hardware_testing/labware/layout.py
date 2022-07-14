from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional

from opentrons import protocol_api
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.instrument_context import InstrumentContext

APP_TIPRACK_CALIBRATION_SLOT = '8'  # where the App puts the tiprack
SCALE_SLOT_ON_OT2 = '6'  # could also be 9, it's sort of between the two

DEFAULT_SLOT_TIPRACK = APP_TIPRACK_CALIBRATION_SLOT
DEFAULT_SLOT_TIPRACK_MULTI = '7'
DEFAULT_SLOT_PLATE = '2'
DEFAULT_SLOT_TROUGH = '5'


test_labware = load_test_labware(get_layout(layouts.GravLayout))
test_labware.plate
test_labware.deck


@dataclass
class LabwareLayout:
    pass


@dataclass
class GravLayout(LabwareLayout):
    tiprack: str
    vial_on_scale: str


@dataclass
class PhotoLayout(LabwareLayout):
    tiprack: str
    tiprack_multi: Optional[str]
    trough: str
    plate: str


@dataclass
class GravPhotoSideBySideLayout(LabwareLayout):
    tiprack: str
    tiprack_multi: Optional[str]
    trough: str
    plate: str
    vial_on_scale: str


@dataclass
class GravPhotoLayout(LabwareLayout):
    tiprack: str
    tiprack_multi: Optional[str]
    trough: str
    plate_on_scale: str


def get_layout(type: LayoutType) -> LabwareLayout:
    return


DEFAULT_GRAV_LAYOUT = GravLayout(tiprack=APP_TIPRACK_CALIBRATION_SLOT,
                                 vial_on_scale=SCALE_SLOT_ON_OT2)
DEFAULT_PHOTO_LAYOUT = PhotoLayout(tiprack=APP_TIPRACK_CALIBRATION_SLOT,
                                   tiprack_multi=DEFAULT_SLOT_TIPRACK_MULTI,
                                   trough=DEFAULT_SLOT_TROUGH,
                                   plate=DEFAULT_SLOT_PLATE)
DEFAULT_GRAV_PHOTO_SIDE_BY_SIDE_LAYOUT = GravPhotoSideBySideLayout(tiprack=APP_TIPRACK_CALIBRATION_SLOT,
                                                                   tiprack_multi=DEFAULT_SLOT_TIPRACK_MULTI,
                                                                   trough=DEFAULT_SLOT_TROUGH,
                                                                   plate=DEFAULT_SLOT_PLATE,
                                                                   vial_on_scale=SCALE_SLOT_ON_OT2)
DEFAULT_GRAV_PHOTO_LAYOUT = GravPhotoLayout(tiprack=APP_TIPRACK_CALIBRATION_SLOT,
                                            tiprack_multi=DEFAULT_SLOT_TIPRACK_MULTI,
                                            trough=DEFAULT_SLOT_TROUGH,
                                            plate_on_scale=SCALE_SLOT_ON_OT2)


def load_layout_labware(layout: LabwareLayout) -> list:
    return []


@dataclass
class PhotometricProtocolItems:
    plate: Labware
    tiprack: Labware
    tiprack_multi: Labware
    trough: Labware
    vial: Labware
    pipette: InstrumentContext
    multi: InstrumentContext


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
