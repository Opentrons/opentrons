from typing import Dict, Set
from dataclasses import dataclass


_lw_fmt = "opentrons_96_{}_{}ul"
_filtertiprack = "filtertiprack"
_tiprack = "tiprack"

TIPRACK_10 = _lw_fmt.format(_tiprack, 10)
TIPRACK_20 = _lw_fmt.format(_tiprack, 20)
TIPRACK_300 = _lw_fmt.format(_tiprack, 300)
TIPRACK_1000 = _lw_fmt.format(_tiprack, 1000)

FILTERTIPRACK_10 = _lw_fmt.format(_filtertiprack, 10)
FILTERTIPRACK_20 = _lw_fmt.format(_filtertiprack, 20)
FILTERTIPRACK_300 = _lw_fmt.format(_filtertiprack, 300)
FILTERTIPRACK_1000 = _lw_fmt.format(_filtertiprack, 1000)


ALLOWED_SESSIONS = {'check'}


@dataclass
class LabwareLookUp:
    load_name: str
    alternatives: Set[str]


LOOKUP_LABWARE: Dict[str, LabwareLookUp] = {
    '10': LabwareLookUp(
        load_name=TIPRACK_10,
        alternatives={
            TIPRACK_20,
            FILTERTIPRACK_10,
            FILTERTIPRACK_20}),
    '20': LabwareLookUp(
        load_name=TIPRACK_20,
        alternatives={
            TIPRACK_20,
            FILTERTIPRACK_10,
            FILTERTIPRACK_20}),
    '50': LabwareLookUp(
        load_name=TIPRACK_300,
        alternatives={
            TIPRACK_300,
            FILTERTIPRACK_300}),
    '300': LabwareLookUp(
         load_name=TIPRACK_300,
         alternatives={
             TIPRACK_300,
             FILTERTIPRACK_300}),
    '1000': LabwareLookUp(
          load_name=TIPRACK_1000,
          alternatives={
              TIPRACK_1000,
              FILTERTIPRACK_1000})
}
