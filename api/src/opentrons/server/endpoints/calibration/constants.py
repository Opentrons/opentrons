from typing import Dict, Union, List

ALLOWED_SESSIONS = ['check']

LOOKUP_LABWARE: Dict[str, Dict[str, Union[List[str], str]]] = {
    '10': {
        'load_name': 'opentrons_96_tiprack_10ul',
        'alternatives': [
            'opentrons_96_tiprack_20ul',
            'opentrons_96_filtertiprack_10ul',
            'opentrons_96_filtertiprack_20ul']
    },
    '20': {
        'load_name': 'opentrons_96_tiprack_20ul',
        'alternatives': [
            'opentrons_96_tiprack_20ul',
            'opentrons_96_filtertiprack_10ul',
            'opentrons_96_filtertiprack_20ul'
        ]
    },
    '50': {
        'load_name': 'opentrons_96_tiprack_300ul',
        'alternatives': [
            'opentrons_96_tiprack_300ul',
            'opentrons_96_filtertiprack_300ul',
        ]
    },
    '300': {
        'load_name': 'opentrons_96_tiprack_300ul',
        'alternatives': [
            'opentrons_96_tiprack_300ul',
            'opentrons_96_filtertiprack_300ul',
        ]
    },
    '1000': {
        'load_name': 'opentrons_96_tiprack_1000ul',
        'alternatives': [
            'opentrons_96_tiprack_1000ul',
            'opentrons_96_filtertiprack_1000ul',
        ]
    }
}
