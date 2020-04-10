from typing import Dict, Set
from dataclasses import dataclass

ALLOWED_SESSIONS = {'check'}


@dataclass
class LabwareLookUp:
    load_name: str
    alternatives: Set[str]


LOOKUP_LABWARE: Dict[str, LabwareLookUp] = {
    '10': LabwareLookUp(
        load_name='opentrons_96_tiprack_10ul',
        alternatives={
            'opentrons_96_tiprack_20ul',
            'opentrons_96_filtertiprack_10ul',
            'opentrons_96_filtertiprack_20ul'}),
    '20': LabwareLookUp(
        load_name='opentrons_96_tiprack_20ul',
        alternatives={
            'opentrons_96_tiprack_20ul',
            'opentrons_96_filtertiprack_10ul',
            'opentrons_96_filtertiprack_20ul'}),
    '50': LabwareLookUp(
        load_name='opentrons_96_tiprack_300ul',
        alternatives={
            'opentrons_96_tiprack_300ul',
            'opentrons_96_filtertiprack_300ul'}),
    '300': LabwareLookUp(
         load_name='opentrons_96_tiprack_300ul',
         alternatives={
             'opentrons_96_tiprack_300ul',
             'opentrons_96_filtertiprack_300ul'}),
    '1000': LabwareLookUp(
          load_name='opentrons_96_tiprack_1000ul',
          alternatives={
              'opentrons_96_tiprack_1000ul',
              'opentrons_96_filtertiprack_1000ul'})
}


class LabwareLoaded(Exception):
    pass


class TipAttachError(Exception):
    pass
