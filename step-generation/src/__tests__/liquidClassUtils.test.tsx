import { describe, expect, it } from 'vitest'

import {
  FIXED_TRASH_ID,
  fixtureTiprack300ul,
  getLabwareDefURI,
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_CENTER,
  POSITION_REFERENCE_TOP,
} from '@opentrons/shared-data'

import {
  DEFAULT_PIPETTE,
  DEST_LABWARE,
  getFlowRateAndOffsetParamsTransferLike,
  SOURCE_LABWARE,
} from '../fixtures'
import { SOURCE_WELL_BLOWOUT_DESTINATION } from '../utils'
import { getCustomLiquidClassProperties } from '../utils/liquidClassUtils'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

describe('getCustomLiquidClassProperties', () => {
  it('returns all args populated', () => {
    expect(
      getCustomLiquidClassProperties({
        args: {
          ...getFlowRateAndOffsetParamsTransferLike(),
          commandCreatorFnName: 'transfer',
          name: 'Transfer Test',
          description: 'test blah blah',
          liquidClass: null,
          pushOut: 0,
          touchTipAfterDispenseSpeed: 5,
          touchTipAfterDispenseMmFromEdge: 3,
          aspirateSubmergeDelay: { seconds: 5 },
          aspirateRetractDelay: { seconds: 10 },
          dispenseSubmergeDelay: { seconds: 50 },
          dispenseRetractDelay: { seconds: 40 },
          sourceWells: ['A1'],
          destWells: ['A2'],
          pipette: DEFAULT_PIPETTE,
          tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
          sourceLabware: SOURCE_LABWARE,
          destLabware: DEST_LABWARE,
          volume: 10,
          touchTipAfterAspirateMmFromEdge: 10,
          touchTipAfterAspirateSpeed: 11,
          changeTip: 'once',
          dispenseAirGapVolume: 0,
          preWetTip: true,
          touchTipAfterAspirate: true,
          mixBeforeAspirate: { times: 4, volume: 10 },
          aspirateDelay: { seconds: 12 },
          dispenseDelay: { seconds: 20 },
          aspirateAirGapVolume: 2,
          touchTipAfterDispense: true,
          mixInDestination: { volume: 10, times: 3 },
          blowoutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
          dropTipLocation: FIXED_TRASH_ID,
          aspirateXOffset: 0,
          dispenseXOffset: 0,
          aspirateYOffset: 0,
          dispenseYOffset: 0,
          aspirateZOffset: 2,
          dispenseZOffset: 3,
          aspiratePositionReference: POSITION_REFERENCE_BOTTOM,
          aspirateSubmergeSpeed: 50,
          aspirateSubmergeXOffset: 1,
          aspirateSubmergeYOffset: 0,
          aspirateSubmergeZOffset: 5,
          aspirateSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
          aspirateRetractSpeed: 51,
          aspirateRetractXOffset: 2,
          aspirateRetractYOffset: -1,
          aspirateRetractZOffset: -4,
          aspirateRetractPositionReference: POSITION_REFERENCE_TOP,
          dispensePositionReference: POSITION_REFERENCE_BOTTOM,
          dispenseSubmergeSpeed: 52,
          dispenseSubmergeXOffset: 2,
          dispenseSubmergeYOffset: 1,
          dispenseSubmergeZOffset: -2,
          dispenseSubmergePositionReference: POSITION_REFERENCE_CENTER,
          dispenseRetractSpeed: 53,
          dispenseRetractXOffset: 3,
          dispenseRetractYOffset: -2,
          dispenseRetractZOffset: -5,
          dispenseRetractPositionReference: POSITION_REFERENCE_TOP,
          nozzles: null,
          stepId: 1,
        },
        pipetteName: 'p20_single_gen2',
        tiprackUri: 'opentrons/opentrons_96_tiprack_20ul/1',
        aspirateCorrectionVolume: 5,
        dispenseCorrectionVolume: 5,
      })
    ).toEqual(
      `
{"p20_single_gen2": {"opentrons/opentrons_96_tiprack_20ul/1": {
    "aspirate": {
        "aspirate_position": {
            "offset": {"x": 0, "y": 0, "z": 2},
            "position_reference": "well-bottom",
        },
        "flow_rate_by_volume": [(0, 2.1)],
        "pre_wet": True,
        "correction_by_volume": [(0, 5)],
        "delay": {"enabled": True, "duration": 12},
        "mix": {"enabled": True, "repetitions": 4, "volume": 10},
        "submerge": {
            "delay": {"enabled": True, "duration": 5},
            "speed": 50,
            "start_position": {
                "offset": {"x": 1, "y": 0, "z": 5},
                "position_reference": "well-bottom",
            },
        },
        "retract": {
            "air_gap_by_volume": [(0, 2)],
            "delay": {"enabled": True, "duration": 10},
            "end_position": {
                "offset": {"x": 2, "y": -1, "z": -4},
                "position_reference": "well-top",
            },
            "speed": 51,
            "touch_tip": {
                "enabled": True,
                "z_offset": -3.4,
                "mm_from_edge": 10,
                "speed": 11,
            },
        },
    },
    "dispense": {
        "dispense_position": {
            "offset": {"x": 0, "y": 0, "z": 3},
            "position_reference": "well-bottom",
        },
        "push_out_by_volume": [(0, 0)],
        "flow_rate_by_volume": [(0, 2.2)],
        "correction_by_volume": [(0, 5)],
        "delay": {"enabled": True, "duration": 20},
        "mix": {"enabled": True, "repetitions": 3, "volume": 10},
        "submerge": {
            "delay": {"enabled": True, "duration": 50},
            "speed": 52,
            "start_position": {
                "offset": {"x": 2, "y": 1, "z": -2},
                "position_reference": "well-center",
            },
        },
        "retract": {
            "air_gap_by_volume": [(0, 0)],
            "delay": {"enabled": True, "duration": 40},
            "end_position": {
                "offset": {"x": 3, "y": -2, "z": -5},
                "position_reference": "well-top",
            },
            "speed": 53,
            "touch_tip": {
                "enabled": True,
                "z_offset": -3.4,
                "mm_from_edge": 3,
                "speed": 5,
            },
            "blowout": {"enabled": True, "location": "source", "flow_rate": 2.3},
        },
    },
}}}
    `.trim()
    )
  })
})
