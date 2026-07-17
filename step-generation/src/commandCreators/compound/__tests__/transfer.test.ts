import { beforeEach, describe, expect, it, test } from 'vitest'

import {
  fixtureTiprack300ul,
  getLabwareDefURI,
  ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_CENTER,
  POSITION_REFERENCE_TOP,
  WASTE_CHUTE_CUTOUT,
  WELL_ORIGIN_BOTTOM,
  WELL_ORIGIN_CENTER,
  WELL_ORIGIN_TOP,
} from '@opentrons/shared-data'

import { CLEAN, FIXED_TRASH_ID, MANUAL } from '../../../constants'
import {
  aspirateHelperLiquidClass,
  blowoutInTrashCommands,
  DEFAULT_PIPETTE,
  DEST_LABWARE,
  dispenseHelperLiquidClass,
  dropTipHelper,
  getErrorResult,
  getFlowRateAndOffsetParamsTransferLike,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
  pickUpTipHelper,
  SOURCE_LABWARE,
} from '../../../fixtures'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '../../../utils/misc'
import { transfer } from '../transfer'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { InvariantContext, RobotState, TransferArgs } from '../../../types'

let invariantContext: InvariantContext
let robotStateWithTip: RobotState
let mixinArgs: Partial<TransferArgs>

beforeEach(() => {
  mixinArgs = {
    ...getFlowRateAndOffsetParamsTransferLike(),
    commandCreatorFnName: 'transfer',
    name: 'Transfer Test',
    description: 'test blah blah',
    pipette: DEFAULT_PIPETTE,
    primaryNozzle: 'A1',

    tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
    sourceLabware: SOURCE_LABWARE,
    destLabware: DEST_LABWARE,

    preWetTip: false,
    touchTipAfterAspirate: false,
    mixBeforeAspirate: null,
    aspirateDelay: null,
    dispenseDelay: null,
    aspirateAirGapVolume: null,
    touchTipAfterDispense: false,
    mixInDestination: null,
    blowoutLocation: null,
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
    aspirateFlowRateUlSec: 10,
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
    dispenseFlowRateUlSec: 12,
    stepNumber: 1,
  }

  invariantContext = makeContext()
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
})

describe('pick up tip if no tip on pipette', () => {
  let noTipArgs: TransferArgs

  beforeEach(() => {
    noTipArgs = {
      ...mixinArgs,
      sourceWells: ['A1'],
      destWells: ['B2'],
      volume: 30,
    } as TransferArgs

    // no tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = {
      hasTip: false,
      tiprackURI: null,
    }
  })

  const changeTipOptions = ['once', 'always']

  changeTipOptions.forEach(changeTip => {
    it(`...${changeTip}`, () => {
      noTipArgs = {
        ...noTipArgs,
        changeTip,
      } as TransferArgs

      const result = transfer(noTipArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)

      expect(res.commands[0]).toEqual(pickUpTipHelper('A1'))
    })
  })
  it('...once, drop tip in waste chute', () => {
    invariantContext = {
      ...invariantContext,
      wasteChuteEntities: {
        wasteChuteId: {
          pythonName: 'waste_chute',
          id: 'wasteChuteId',
          location: 'cutoutD3',
        },
      },
    }

    robotStateWithTip.tipState.pipettes.p300SingleId = {
      hasTip: true,
      tiprackURI: 'tiprack1Id',
    }

    noTipArgs = {
      ...noTipArgs,
      changeTip: 'always',
      dropTipLocation: 'wasteChuteId',
      dispenseAirGapVolume: 5,
    } as TransferArgs

    const result = transfer(noTipArgs, invariantContext, robotStateWithTip)

    const res = getSuccessResult(result)
    expect(res.python).toEqual(
      `
mock_pipette.transfer_with_liquid_class(
    volume=30,
    source=[mock_source_plate["A1"]],
    dest=[mock_dest_plate["B2"]],
    new_tip="always",
    trash_location=waste_chute,
    keep_last_tip=True,
    tip_racks=[mock_tip_rack_1, mock_tip_rack_2],
    liquid_class=protocol.define_liquid_class(
        name="transfer_step_1",
        properties={"p300_single": {"fixture/fixture_tiprack_300_ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 0, "y": 0, "z": 2},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 10)],
                "pre_wet": False,
                "correction_by_volume": [(0, 0)],
                "delay": {"enabled": False},
                "mix": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 50,
                    "start_position": {
                        "offset": {"x": 1, "y": 0, "z": 5},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 2, "y": -1, "z": -4},
                        "position_reference": "well-top",
                    },
                    "speed": 51,
                    "touch_tip": {"enabled": False},
                },
            },
            "dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 3},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 12)],
                "delay": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 52,
                    "start_position": {
                        "offset": {"x": 2, "y": 1, "z": -2},
                        "position_reference": "well-center",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 5)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 3, "y": -2, "z": -5},
                        "position_reference": "well-top",
                    },
                    "speed": 53,
                    "touch_tip": {"enabled": False},
                    "blowout": {"enabled": False},
                },
                "correction_by_volume": [(0, 0)],
                "push_out_by_volume": [(0, 0)],
                "mix": {"enabled": False},
            },
        }}},
    ),
)`.trimStart()
    )
    expect(res.commands).toEqual([
      //   drop tip from return tip
      {
        commandType: 'moveToAddressableArea',
        key: expect.any(String),

        params: {
          addressableAreaName: '1ChannelWasteChute',
          offset: {
            x: 0,
            y: 0,
            z: 0,
          },
          pipetteId: 'p300SingleId',
        },
      },
      {
        commandType: 'dropTipInPlace',
        key: expect.any(String),

        params: {
          pipetteId: 'p300SingleId',
        },
      },
      pickUpTipHelper('A1'),
      ...aspirateHelperLiquidClass({
        volume: 30,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
      }),
      ...dispenseHelperLiquidClass({
        volume: 30,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        dispenseAirGap: 5,
        pipetteId: 'p300SingleId',
        wellName: 'B2',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
    ])
  })
})

it('single transfer: 1 source & 1 dest', () => {
  mixinArgs = {
    ...mixinArgs,
    sourceWells: ['A1'],
    destWells: ['B2'],
    changeTip: 'never',
    volume: 30,
  }

  robotStateWithTip.liquidState.labware.sourcePlateId.A1 = {
    '0': { volume: 200 },
  }

  const result = transfer(
    mixinArgs as TransferArgs,
    invariantContext,
    robotStateWithTip
  )
  const res = getSuccessResult(result)
  expect(res.python).toEqual(
    `
mock_pipette.transfer_with_liquid_class(
    volume=30,
    source=[mock_source_plate["A1"]],
    dest=[mock_dest_plate["B2"]],
    new_tip="never",
    trash_location=trash_bin_1,
    keep_last_tip=True,
    tip_racks=[mock_tip_rack_1, mock_tip_rack_2],
    liquid_class=protocol.define_liquid_class(
        name="transfer_step_1",
        properties={"p300_single": {"fixture/fixture_tiprack_300_ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 0, "y": 0, "z": 2},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 10)],
                "pre_wet": False,
                "correction_by_volume": [(0, 0)],
                "delay": {"enabled": False},
                "mix": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 50,
                    "start_position": {
                        "offset": {"x": 1, "y": 0, "z": 5},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 2, "y": -1, "z": -4},
                        "position_reference": "well-top",
                    },
                    "speed": 51,
                    "touch_tip": {"enabled": False},
                },
            },
            "dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 3},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 12)],
                "delay": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 52,
                    "start_position": {
                        "offset": {"x": 2, "y": 1, "z": -2},
                        "position_reference": "well-center",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 3, "y": -2, "z": -5},
                        "position_reference": "well-top",
                    },
                    "speed": 53,
                    "touch_tip": {"enabled": False},
                    "blowout": {"enabled": False},
                },
                "correction_by_volume": [(0, 0)],
                "push_out_by_volume": [(0, 0)],
                "mix": {"enabled": False},
            },
        }}},
    ),
)`.trimStart()
  )
  expect(res.commands).toEqual([
    ...aspirateHelperLiquidClass({
      volume: 30,
      aspirateFlowRate: 10,
      submergeSpeed: 50,
      retractSpeed: 51,
      pipetteId: 'p300SingleId',
      wellName: 'A1',
      labwareId: SOURCE_LABWARE,
      submergeLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 1,
          y: 0,
          z: 5,
        },
      },
      retractLocation: {
        origin: WELL_ORIGIN_TOP,
        offset: {
          x: 2,
          y: -1,
          z: -4,
        },
      },
      aspirateLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 0,
          y: 0,
          z: 2,
        },
      },
      shouldProbe: false,
    }),
    ...dispenseHelperLiquidClass({
      volume: 30,
      aspirateFlowRate: 10,
      dispenseFlowRate: 12,
      submergeSpeed: 52,
      retractSpeed: 53,
      pipetteId: 'p300SingleId',
      wellName: 'B2',
      labwareId: DEST_LABWARE,
      submergeLocation: {
        origin: WELL_ORIGIN_CENTER,
        offset: {
          x: 2,
          y: 1,
          z: -2,
        },
      },
      retractLocation: {
        origin: WELL_ORIGIN_TOP,
        offset: {
          x: 3,
          y: -2,
          z: -5,
        },
      },
      dispenseLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 0,
          y: 0,
          z: 3,
        },
      },
    }),
  ])
})

test('single transfer: 1 source & 1 dest with waste chute', () => {
  const mockWasteChuteId = 'mockWasteChuteId'

  mixinArgs = {
    ...mixinArgs,
    destLabware: mockWasteChuteId,
    sourceWells: ['A1'],
    destWells: null,
    changeTip: 'never',
    volume: 30,
    dropTipLocation: mockWasteChuteId,
  }

  invariantContext = {
    ...invariantContext,
    wasteChuteEntities: {
      mockWasteChuteId: {
        pythonName: 'waste_chute',
        id: mockWasteChuteId,
        location: WASTE_CHUTE_CUTOUT,
      },
    },
  }
  robotStateWithTip.liquidState.wasteChute.mockWasteChuteId = {
    '0': { volume: 200 },
  }
  robotStateWithTip.liquidState.labware.sourcePlateId.A1 = {
    '0': { volume: 200 },
  }

  const result = transfer(
    mixinArgs as TransferArgs,
    invariantContext,
    robotStateWithTip
  )
  const res = getSuccessResult(result)
  expect(res.commands).toEqual([
    ...aspirateHelperLiquidClass({
      volume: 30,
      aspirateFlowRate: 10,
      submergeSpeed: 50,
      retractSpeed: 51,
      pipetteId: 'p300SingleId',
      wellName: 'A1',
      labwareId: SOURCE_LABWARE,
      submergeLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 1,
          y: 0,
          z: 5,
        },
      },
      aspirateLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 0,
          y: 0,
          z: 2,
        },
      },
      retractLocation: {
        origin: WELL_ORIGIN_TOP,
        offset: {
          x: 2,
          y: -1,
          z: -4,
        },
      },
      shouldProbe: false,
    }),
    {
      commandType: 'moveToAddressableArea',
      key: expect.any(String),
      params: {
        addressableAreaName: ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
        pipetteId: 'p300SingleId',
        offset: { x: 0, y: 0, z: 0 },
      },
    },
    {
      commandType: 'dispenseInPlace',
      key: expect.any(String),
      params: {
        flowRate: 12,
        pipetteId: 'p300SingleId',
        volume: 30,
      },
    },
  ])
})

test('transfer with multiple sets of wells', () => {
  mixinArgs = {
    ...mixinArgs,
    sourceWells: ['A1', 'A2'],
    destWells: ['B2', 'C2'],
    changeTip: 'never',
    volume: 30,
  }
  const result = transfer(
    mixinArgs as TransferArgs,
    invariantContext,
    robotStateWithTip
  )
  const res = getSuccessResult(result)
  expect(res.python).toEqual(
    `
mock_pipette.transfer_with_liquid_class(
    volume=30,
    source=[mock_source_plate["A1"], mock_source_plate["A2"]],
    dest=[mock_dest_plate["B2"], mock_dest_plate["C2"]],
    new_tip="never",
    trash_location=trash_bin_1,
    keep_last_tip=True,
    tip_racks=[mock_tip_rack_1, mock_tip_rack_2],
    liquid_class=protocol.define_liquid_class(
        name="transfer_step_1",
        properties={"p300_single": {"fixture/fixture_tiprack_300_ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 0, "y": 0, "z": 2},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 10)],
                "pre_wet": False,
                "correction_by_volume": [(0, 0)],
                "delay": {"enabled": False},
                "mix": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 50,
                    "start_position": {
                        "offset": {"x": 1, "y": 0, "z": 5},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 2, "y": -1, "z": -4},
                        "position_reference": "well-top",
                    },
                    "speed": 51,
                    "touch_tip": {"enabled": False},
                },
            },
            "dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 3},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 12)],
                "delay": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 52,
                    "start_position": {
                        "offset": {"x": 2, "y": 1, "z": -2},
                        "position_reference": "well-center",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 3, "y": -2, "z": -5},
                        "position_reference": "well-top",
                    },
                    "speed": 53,
                    "touch_tip": {"enabled": False},
                    "blowout": {"enabled": False},
                },
                "correction_by_volume": [(0, 0)],
                "push_out_by_volume": [(0, 0)],
                "mix": {"enabled": False},
            },
        }}},
    ),
)`.trimStart()
  )
  expect(res.commands).toEqual([
    ...aspirateHelperLiquidClass({
      volume: 30,
      aspirateFlowRate: 10,
      submergeSpeed: 50,
      retractSpeed: 51,
      pipetteId: 'p300SingleId',
      wellName: 'A1',
      labwareId: SOURCE_LABWARE,
      submergeLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 1,
          y: 0,
          z: 5,
        },
      },
      aspirateLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 0,
          y: 0,
          z: 2,
        },
      },
      retractLocation: {
        origin: WELL_ORIGIN_TOP,
        offset: {
          x: 2,
          y: -1,
          z: -4,
        },
      },
      shouldProbe: false,
    }),
    ...dispenseHelperLiquidClass({
      volume: 30,
      aspirateFlowRate: 10,
      dispenseFlowRate: 12,
      submergeSpeed: 52,
      retractSpeed: 53,
      pipetteId: 'p300SingleId',
      wellName: 'B2',
      labwareId: DEST_LABWARE,
      submergeLocation: {
        origin: WELL_ORIGIN_CENTER,
        offset: {
          x: 2,
          y: 1,
          z: -2,
        },
      },
      retractLocation: {
        origin: WELL_ORIGIN_TOP,
        offset: {
          x: 3,
          y: -2,
          z: -5,
        },
      },
      dispenseLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 0,
          y: 0,
          z: 3,
        },
      },
    }),

    ...aspirateHelperLiquidClass({
      volume: 30,
      aspirateFlowRate: 10,
      submergeSpeed: 50,
      retractSpeed: 51,
      pipetteId: 'p300SingleId',
      wellName: 'A2',
      labwareId: SOURCE_LABWARE,
      submergeLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 1,
          y: 0,
          z: 5,
        },
      },
      aspirateLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 0,
          y: 0,
          z: 2,
        },
      },
      retractLocation: {
        origin: WELL_ORIGIN_TOP,
        offset: {
          x: 2,
          y: -1,
          z: -4,
        },
      },
      shouldProbe: false,
    }),

    ...dispenseHelperLiquidClass({
      volume: 30,
      aspirateFlowRate: 10,
      dispenseFlowRate: 12,
      submergeSpeed: 52,
      retractSpeed: 53,
      pipetteId: 'p300SingleId',
      wellName: 'C2',
      labwareId: DEST_LABWARE,
      submergeLocation: {
        origin: WELL_ORIGIN_CENTER,
        offset: {
          x: 2,
          y: 1,
          z: -2,
        },
      },
      retractLocation: {
        origin: WELL_ORIGIN_TOP,
        offset: {
          x: 3,
          y: -2,
          z: -5,
        },
      },
      dispenseLocation: {
        origin: WELL_ORIGIN_BOTTOM,
        offset: {
          x: 0,
          y: 0,
          z: 3,
        },
      },
    }),
  ])

  // TODO Ian 2018-04-02 robotState, liquidState checks
})

test('invalid pipette ID should throw error', () => {
  mixinArgs = {
    ...mixinArgs,
    sourceWells: ['A1'],
    destWells: ['B1'],
    volume: 10,
    changeTip: 'always',
    pipette: 'no-such-pipette-id-here',
  }

  const result = transfer(
    mixinArgs as TransferArgs,
    invariantContext,
    robotStateWithTip
  )
  const res = getErrorResult(result)

  expect(res.errors).toHaveLength(1)
  expect(res.errors[0]).toMatchObject({
    type: 'PIPETTE_DOES_NOT_EXIST',
  })
})

test('invalid labware ID should throw error', () => {
  mixinArgs = {
    ...mixinArgs,
    sourceLabware: 'no-such-labware-id-here',
    sourceWells: ['A1'],
    destWells: ['B1'],
    volume: 10,
    changeTip: 'always',
  }

  const result = transfer(
    mixinArgs as TransferArgs,
    invariantContext,
    robotStateWithTip
  )
  const res = getErrorResult(result)

  expect(res.errors).toHaveLength(1)
  expect(res.errors[0]).toMatchObject({
    type: 'LABWARE_DOES_NOT_EXIST',
  })
})

describe('single transfer exceeding pipette max', () => {
  let transferArgs: TransferArgs

  beforeEach(() => {
    transferArgs = {
      ...mixinArgs,
      sourceWells: ['A1', 'B1'],
      destWells: ['A3', 'B3'],
      volume: 350,
    } as TransferArgs
    // tip setup: tiprack's A1 has tip, pipette has no tip
    robotStateWithTip.tipState.tipracks.tiprack1Id.A1 = CLEAN
    robotStateWithTip.tipState.pipettes.p300SingleId = {
      hasTip: false,
      tiprackURI: null,
    }
    // liquid setup
    robotStateWithTip.liquidState.labware.sourcePlateId.A1 = {
      '0': { volume: 400 },
    }
    robotStateWithTip.liquidState.labware.sourcePlateId.B1 = {
      '1': { volume: 400 },
    }
  })

  it('changeTip="once"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'once',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),
      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'A3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'A3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),

      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
    ])
  })

  it('changeTip="once" with return tip should not return tip between volume chunks', () => {
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1'],
      destWells: ['A3'],
      changeTip: 'once',
      dropTipLocation: getLabwareDefURI(
        fixtureTiprack300ul as LabwareDefinition2
      ),
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    const returnTipCommands = res.commands.filter(
      command => command.commandType === 'dropTip'
    )
    expect(returnTipCommands).toHaveLength(1)
    expect(returnTipCommands[0]).toMatchObject({
      params: {
        pipetteId: 'p300SingleId',
        labwareId: 'tiprack1Id',
        wellName: 'A1',
      },
    })
  })

  it('changeTip="always"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'always',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
      }),

      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'A3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      // replace tip before next asp-disp chunk
      ...dropTipHelper(),
      pickUpTipHelper('B1'),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        shouldProbe: false,
      }),

      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'A3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      // replace tip before next source-dest well pair
      ...dropTipHelper(),
      pickUpTipHelper('C1'),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
      }),

      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      // replace tip before next asp-disp chunk
      ...dropTipHelper(),
      pickUpTipHelper('D1'),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),

      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
    ])
  })

  it('changeTip="perSource"', () => {
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1', 'A1', 'A2'],
      destWells: ['B1', 'B2', 'B2'],
      changeTip: 'perSource',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
      }),

      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),

      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      // same source, different dest: no change
      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),

      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B2',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B2',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      // new source, different dest: change tip
      ...dropTipHelper(),
      pickUpTipHelper('B1'),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A2',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B2',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A2',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B2',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
    ])
  })

  it('changeTip="perDest"', () => {
    // NOTE: same wells as perSource test
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1', 'A1', 'A2'],
      destWells: ['B1', 'B2', 'B2'],
      changeTip: 'perDest',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      // same source, different dest: change tip
      ...dropTipHelper(),
      pickUpTipHelper('B1'),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B2',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B2',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      // different source, same dest: no change

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A2',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B2',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A2',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B2',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
    ])
  })

  it('changeTip="never"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'never',
    }
    // begin with tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = {
      hasTip: true,
      tiprackURI: 'tiprack1Id',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      // no pick up tip
      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'A3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),

      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'A3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),

      ...aspirateHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 175,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
    ])
  })

  it('split up volume without going below pipette min', () => {
    transferArgs = {
      ...transferArgs,
      volume: 629,
      changeTip: 'never', // don't test tip use here
    }

    // begin with tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = {
      hasTip: true,
      tiprackURI: 'tiprack1Id',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      ...aspirateHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'A3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
      // last 2 chunks split evenly
      ...aspirateHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'A3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
      ...aspirateHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'A1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'A3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
      ...aspirateHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
      // last 2 chunks split evenly
      ...aspirateHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
      ...aspirateHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        submergeSpeed: 50,
        retractSpeed: 51,
        pipetteId: 'p300SingleId',
        wellName: 'B1',
        labwareId: SOURCE_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 1,
            y: 0,
            z: 5,
          },
        },
        aspirateLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 2,
            y: -1,
            z: -4,
          },
        },
        shouldProbe: false,
      }),
      ...dispenseHelperLiquidClass({
        volume: 629 / 3,
        aspirateFlowRate: 10,
        dispenseFlowRate: 12,
        submergeSpeed: 52,
        retractSpeed: 53,
        pipetteId: 'p300SingleId',
        wellName: 'B3',
        labwareId: DEST_LABWARE,
        submergeLocation: {
          origin: WELL_ORIGIN_CENTER,
          offset: {
            x: 2,
            y: 1,
            z: -2,
          },
        },
        retractLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            x: 3,
            y: -2,
            z: -5,
          },
        },
        dispenseLocation: {
          origin: WELL_ORIGIN_BOTTOM,
          offset: {
            x: 0,
            y: 0,
            z: 3,
          },
        },
      }),
    ])
  })
})

describe('advanced options', () => {
  let advArgs: TransferArgs

  beforeEach(() => {
    advArgs = {
      ...mixinArgs,
      sourceWells: ['A1'],
      destWells: ['B1'],
      changeTip: 'never',
    } as TransferArgs
  })
  describe('...aspirate options', () => {
    it('pre-wet tip should aspirate and dispense the transfer volume from source well of each subtransfer', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        preWetTip: true,
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
          shouldPreWet: true,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
          shouldPreWet: true,
        }),

        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
      ])
    })

    it('pre-wet tip should use the aspirate delay when specified', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        preWetTip: true,
        aspirateDelay: { seconds: 12 },
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        // pre-wet aspirate/dispense
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          aspirateDelay: 12,
          shouldProbe: false,
          shouldPreWet: true,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          aspirateDelay: 12,
          shouldProbe: false,
          shouldPreWet: true,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
      ])
    })

    it('pre-wet tip should use the dispense delay when specified', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        preWetTip: true,
        dispenseDelay: { seconds: 12 },
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          dispenseDelay: 12,
          shouldProbe: false,
          shouldPreWet: true,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          dispenseDelay: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
          shouldPreWet: true,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          dispenseDelay: 12,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
      ])
    })

    it('should touchTip after aspirate on each source well, for every aspirate', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        touchTipAfterAspirate: true,
        touchTipAfterAspirateOffsetMmFromTop: -2,
        touchTipAfterAspirateMmFromEdge: 0.1,
        touchTipAfterAspirateSpeed: 17,
      }
      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
          shouldTouchTip: true,
          touchTipMmFromEdge: 0.1,
          touchTipMmFromTop: -2,
          touchTipSpeed: 17,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
          shouldTouchTip: true,
          touchTipMmFromEdge: 0.1,
          touchTipMmFromTop: -2,
          touchTipSpeed: 17,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
      ])
    })

    it('should touchTip after dispense on each dest well, for every dispense', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        touchTipAfterDispense: true,
        touchTipAfterDispenseMmFromEdge: 1.5,
        touchTipAfterDispenseOffsetMmFromTop: -0.5,
        touchTipAfterDispenseSpeed: 60,
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          shouldTouchTip: true,
          touchTipMmFromEdge: 1.5,
          touchTipMmFromTop: -0.5,
          touchTipSpeed: 60,
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          shouldTouchTip: true,
          touchTipMmFromEdge: 1.5,
          touchTipMmFromTop: -0.5,
          touchTipSpeed: 60,
        }),
      ])
    })

    it('should mix before aspirate', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        mixBeforeAspirate: {
          volume: 250,
          times: 2,
        },
      }

      // written here for less verbose `commands` below
      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
          mixTimes: 2,
          mixVolume: 250,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
          mixTimes: 2,
          mixVolume: 250,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
      ])
    })
    it('should delay after mix aspirate and regular aspirate', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        mixBeforeAspirate: {
          volume: 250,
          times: 2,
        },
        aspirateDelay: { seconds: 12 },
      }

      // mixes will include the delays after aspirating
      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          aspirateDelay: 12,
          shouldProbe: false,
          mixTimes: 2,
          mixVolume: 250,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          aspirateDelay: 12,
          shouldProbe: false,
          mixTimes: 2,
          mixVolume: 250,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
      ])
    })

    it('should delay after aspirate', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        aspirateDelay: { seconds: 12 },
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          aspirateDelay: 12,
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          aspirateDelay: 12,
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
      ])
    })

    it('should air gap after aspirate', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        aspirateAirGapVolume: 5,
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          aspirateAirGap: 5,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          aspirateAirGap: 5,
        }),
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          submergeSpeed: 50,
          retractSpeed: 51,
          aspirateAirGap: 5,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          aspirateAirGap: 5,
        }),
      ])
    })
    it('should air gap after aspirate and break into two chunks', () => {
      advArgs = {
        ...advArgs,
        volume: 300,
        aspirateAirGapVolume: 5,
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 150,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          submergeSpeed: 50,
          retractSpeed: 51,
          aspirateAirGap: 5,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 150,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          aspirateAirGap: 5,
        }),

        ...aspirateHelperLiquidClass({
          volume: 150,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          submergeSpeed: 50,
          retractSpeed: 51,
          aspirateAirGap: 5,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 150,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          aspirateAirGap: 5,
        }),
      ])
    })
    it('should delay after air gap aspirate and regular aspirate', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        aspirateAirGapVolume: 5,
        aspirateDelay: { seconds: 12 },
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateAirGap: 5,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          aspirateDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          aspirateAirGap: 5,
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          aspirateDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          aspirateAirGap: 5,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),

        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          aspirateAirGap: 5,
        }),
      ])
    })
    it('should delay after air gap dispense and regular dispense', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        aspirateAirGapVolume: 5,
        dispenseDelay: { seconds: 12 },
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          aspirateAirGap: 5,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),

        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          aspirateAirGap: 5,
          dispenseDelay: 12,
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          aspirateAirGap: 5,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          aspirateAirGap: 5,
          dispenseDelay: 12,
        }),
      ])
    })
  })

  describe('...dispense options', () => {
    it('should mix after dispense', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        mixInDestination: {
          volume: 250,
          times: 2,
        },
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 2,
          mixVolume: 250,
        }),
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 2,
          mixVolume: 250,
        }),
      ])
    })
    it('should delay after mix dispense and after dispense', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        mixInDestination: {
          volume: 250,
          times: 2,
        },
        dispenseDelay: { seconds: 12 },
      }

      // mixes will include the delays after aspirating
      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 2,
          mixVolume: 250,
          dispenseDelay: 12,
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 2,
          mixVolume: 250,
          dispenseDelay: 12,
        }),
      ])
    })

    it('should delay after dispense', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        dispenseDelay: { seconds: 12 },
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          dispenseDelay: 12,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 2.2,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          shouldProbe: false,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          dispenseDelay: 12,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
        }),
      ])
    })
  })

  describe('all advanced settings enabled', () => {
    let allArgs: TransferArgs
    beforeEach(() => {
      allArgs = {
        ...mixinArgs,
        sourceWells: ['A1'],
        destWells: ['B1'],
        volume: 350,
        // aspirate column
        preWetTip: true,
        mixBeforeAspirate: {
          volume: 35,
          times: 1,
        },
        aspirateDelay: { seconds: 11, mmFromBottom: 15 },
        touchTipAfterAspirate: true,
        touchTipAfterAspirateOffsetMmFromTop: -14.5,
        aspirateAirGapVolume: 31,
        // dispense column
        dispenseDelay: { seconds: 12, mmFromBottom: 14 },
        mixInDestination: {
          volume: 36,
          times: 1,
        },
        touchTipAfterDispense: true,
        blowoutFlowRateUlSec: 2.3,
        blowoutOffsetFromTopMm: 3.3,
        dispenseAirGapVolume: 3,
      } as TransferArgs
    })

    it('should create commands in the expected order with expected params (blowout in trash)', () => {
      const args = {
        ...allArgs,
        changeTip: 'never',
        blowoutLocation: 'fixedTrash',
      } as TransferArgs
      const result = transfer(args, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.python).toEqual(
        `
mock_pipette.transfer_with_liquid_class(
    volume=350,
    source=[mock_source_plate["A1"]],
    dest=[mock_dest_plate["B1"]],
    new_tip="never",
    trash_location=trash_bin_1,
    keep_last_tip=True,
    tip_racks=[mock_tip_rack_1, mock_tip_rack_2],
    liquid_class=protocol.define_liquid_class(
        name="transfer_step_1",
        properties={"p300_single": {"fixture/fixture_tiprack_300_ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 0, "y": 0, "z": 2},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 10)],
                "pre_wet": True,
                "correction_by_volume": [(0, 0)],
                "delay": {"enabled": True, "duration": 11},
                "mix": {"enabled": True, "repetitions": 1, "volume": 35},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 50,
                    "start_position": {
                        "offset": {"x": 1, "y": 0, "z": 5},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 31)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 2, "y": -1, "z": -4},
                        "position_reference": "well-top",
                    },
                    "speed": 51,
                    "touch_tip": {"enabled": True, "z_offset": -14.5},
                },
            },
            "dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 3},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 12)],
                "delay": {"enabled": True, "duration": 12},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 52,
                    "start_position": {
                        "offset": {"x": 2, "y": 1, "z": -2},
                        "position_reference": "well-center",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 3)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 3, "y": -2, "z": -5},
                        "position_reference": "well-top",
                    },
                    "speed": 53,
                    "touch_tip": {"enabled": True, "z_offset": -3.4},
                    "blowout": {"enabled": True, "location": "trash", "flow_rate": 2.3},
                },
                "correction_by_volume": [(0, 0)],
                "push_out_by_volume": [(0, 0)],
                "mix": {"enabled": True, "repetitions": 1, "volume": 36},
            },
        }}},
    ),
)`.trimStart()
      )
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          aspirateDelay: 11,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          mixTimes: 1,
          mixVolume: 35,
          shouldPreWet: true,
          shouldProbe: false,
          shouldTouchTip: true,
          touchTipMmFromTop: -14.5,
          aspirateAirGap: 31,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 1,
          mixVolume: 36,
          aspirateAirGap: 31,
          dispenseDelay: 12,
          aspirateDelay: 11,
          shouldTouchTip: true,
          touchTipMmFromTop: -3.4,
          dispenseAirGap: 3,
        }),

        ...blowoutInTrashCommands({
          pipetteId: 'p300SingleId',
          addressableAreaName: 'movableTrashA3',
          dispenseAirGap: 3,
          blowoutFlowRate: 2.3,
          aspirateDelay: 11,
          aspirateFlowRate: 10,
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          aspirateDelay: 11,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          mixTimes: 1,
          mixVolume: 35,
          shouldPreWet: true,
          shouldProbe: false,
          shouldTouchTip: true,
          touchTipMmFromTop: -14.5,
          aspirateAirGap: 31,
          dispenseAirGap: 3,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 1,
          mixVolume: 36,
          aspirateAirGap: 31,
          dispenseDelay: 12,
          aspirateDelay: 11,
          shouldTouchTip: true,
          touchTipMmFromTop: -3.4,
          dispenseAirGap: 3,
        }),

        ...blowoutInTrashCommands({
          pipetteId: 'p300SingleId',
          addressableAreaName: 'movableTrashA3',
          blowoutFlowRate: 2.3,
          aspirateFlowRate: 10,
        }),
      ])
    })

    it('should create commands in the expected order with expected params (blowout in dest well, reuse tip)', () => {
      const args = {
        ...allArgs,
        changeTip: 'never',
        blowoutLocation: DEST_WELL_BLOWOUT_DESTINATION,
      } as TransferArgs

      const result = transfer(args, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          aspirateDelay: 11,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          mixTimes: 1,
          mixVolume: 35,
          shouldPreWet: true,
          shouldProbe: false,
          shouldTouchTip: true,
          touchTipMmFromTop: -14.5,
          aspirateAirGap: 31,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 1,
          mixVolume: 36,
          aspirateAirGap: 31,
          dispenseDelay: 12,
          aspirateDelay: 11,
          shouldTouchTip: true,
          touchTipMmFromTop: -3.4,
          dispenseAirGap: 3,
          shouldBlowoutInDestination: true,
          blowoutFlowRate: 2.3,
        }),

        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          aspirateDelay: 11,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          mixTimes: 1,
          mixVolume: 35,
          shouldProbe: false,
          dispenseAirGap: 3,
          shouldTouchTip: true,
          touchTipMmFromTop: -14.5,
          aspirateAirGap: 31,
          shouldPreWet: true,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 1,
          mixVolume: 36,
          aspirateAirGap: 31,
          dispenseDelay: 12,
          aspirateDelay: 11,
          shouldTouchTip: true,
          touchTipMmFromTop: -3.4,
          shouldBlowoutInDestination: true,
          blowoutFlowRate: 2.3,
        }),
      ])
    })

    it('should create commands in the expected order with expected params (blowout in dest well, change tip perSource)', () => {
      const args = {
        ...allArgs,
        changeTip: 'perSource',
        blowoutLocation: DEST_WELL_BLOWOUT_DESTINATION,
      } as TransferArgs

      const result = transfer(args, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        // get fresh tip b/c it's per source
        {
          commandType: 'moveToAddressableAreaForDropTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            addressableAreaName: 'movableTrashA3',
            offset: { x: 0, y: 0, z: 0 },
            alternateDropLocation: true,
          },
        },
        {
          commandType: 'dropTipInPlace',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
          },
        },

        {
          commandType: 'pickUpTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'tiprack1Id',
            wellName: 'A1',
          },
        },
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          aspirateDelay: 11,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          mixTimes: 1,
          mixVolume: 35,
          shouldPreWet: true,
          shouldTouchTip: true,
          touchTipMmFromTop: -14.5,
          aspirateAirGap: 31,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 1,
          mixVolume: 36,
          aspirateAirGap: 31,
          dispenseDelay: 12,
          aspirateDelay: 11,
          shouldTouchTip: true,
          touchTipMmFromTop: -3.4,
          dispenseAirGap: 3,
          shouldBlowoutInDestination: true,
          blowoutFlowRate: 2.3,
        }),
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          aspirateDelay: 11,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          mixTimes: 1,
          mixVolume: 35,
          shouldProbe: false,
          dispenseAirGap: 3,
          shouldTouchTip: true,
          touchTipMmFromTop: -14.5,
          aspirateAirGap: 31,
          shouldPreWet: true,
        }),

        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 1,
          mixVolume: 36,
          aspirateAirGap: 31,
          dispenseDelay: 12,
          aspirateDelay: 11,
          shouldTouchTip: true,
          touchTipMmFromTop: -3.4,
          shouldBlowoutInDestination: true,
          blowoutFlowRate: 2.3,
          dispenseAirGap: 3,
        }),
      ])
    })

    it('should create commands in the expected order with expected params (blowout in source well, change tip each aspirate)', () => {
      const args = {
        ...allArgs,
        changeTip: 'always',
        blowoutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
      } as TransferArgs

      const result = transfer(args, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        // get fresh tip b/c it's per source
        {
          commandType: 'moveToAddressableAreaForDropTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            addressableAreaName: 'movableTrashA3',
            offset: { x: 0, y: 0, z: 0 },
            alternateDropLocation: true,
          },
        },
        {
          commandType: 'dropTipInPlace',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
          },
        },
        {
          commandType: 'pickUpTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'tiprack1Id',
            wellName: 'A1',
          },
        },
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          aspirateDelay: 11,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          mixTimes: 1,
          mixVolume: 35,
          shouldPreWet: true,
          shouldTouchTip: true,
          touchTipMmFromTop: -14.5,
          aspirateAirGap: 31,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 1,
          mixVolume: 36,
          aspirateAirGap: 31,
          dispenseDelay: 12,
          aspirateDelay: 11,
          shouldTouchTip: true,
          touchTipMmFromTop: -3.4,
          dispenseAirGap: 3,
        }),
        {
          commandType: 'moveToWell',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'sourcePlateId',
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
            },
          },
        },
        {
          commandType: 'blowOutInPlace',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            flowRate: 2.3,
          },
        },
        // touch tip (disp)
        {
          commandType: 'touchTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'sourcePlateId',
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: {
                z: -3.4,
              },
            },
          },
        },
        {
          commandType: 'moveToWell',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'sourcePlateId',
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
            },
          },
        },
        {
          commandType: 'prepareToAspirate',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
          },
        },
        {
          commandType: 'airGapInPlace',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            volume: 3,
            flowRate: 10,
          },
        },
        {
          commandType: 'waitForDuration',
          key: expect.any(String),
          params: { seconds: 11 },
        },
        {
          commandType: 'moveToAddressableAreaForDropTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            addressableAreaName: 'movableTrashA3',
            offset: { x: 0, y: 0, z: 0 },
            alternateDropLocation: true,
          },
        },
        {
          commandType: 'dropTipInPlace',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
          },
        },
        {
          commandType: 'pickUpTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'tiprack1Id',
            wellName: 'B1',
          },
        },
        // next chunk from A1: remaining volume
        // do not pre-wet
        // mix (asp)
        ...aspirateHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          aspirateDelay: 11,
          dispenseDelay: 12,
          submergeSpeed: 50,
          retractSpeed: 51,
          pipetteId: 'p300SingleId',
          wellName: 'A1',
          labwareId: SOURCE_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 1,
              y: 0,
              z: 5,
            },
          },
          aspirateLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 2,
              y: -1,
              z: -4,
            },
          },
          mixTimes: 1,
          mixVolume: 35,
          shouldProbe: false,
          shouldTouchTip: true,
          shouldPreWet: true,
          touchTipMmFromTop: -14.5,
          aspirateAirGap: 31,
        }),
        ...dispenseHelperLiquidClass({
          volume: 175,
          aspirateFlowRate: 10,
          dispenseFlowRate: 12,
          submergeSpeed: 52,
          retractSpeed: 53,
          pipetteId: 'p300SingleId',
          wellName: 'B1',
          labwareId: DEST_LABWARE,
          submergeLocation: {
            origin: WELL_ORIGIN_CENTER,
            offset: {
              x: 2,
              y: 1,
              z: -2,
            },
          },
          retractLocation: {
            origin: WELL_ORIGIN_TOP,
            offset: {
              x: 3,
              y: -2,
              z: -5,
            },
          },
          dispenseLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              x: 0,
              y: 0,
              z: 3,
            },
          },
          mixTimes: 1,
          mixVolume: 36,
          aspirateAirGap: 31,
          dispenseDelay: 12,
          aspirateDelay: 11,
          shouldTouchTip: true,
          touchTipMmFromTop: -3.4,
          dispenseAirGap: 3,
        }),

        {
          commandType: 'moveToWell',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'sourcePlateId',
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
            },
          },
        },
        {
          commandType: 'blowOutInPlace',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            flowRate: 2.3,
          },
        },
        // touch tip (disp)
        {
          commandType: 'touchTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'sourcePlateId',
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: {
                z: -3.4,
              },
            },
          },
        },
        {
          commandType: 'moveToWell',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'sourcePlateId',
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
            },
          },
        },
        {
          commandType: 'prepareToAspirate',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
          },
        },
        {
          commandType: 'airGapInPlace',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            volume: 3,
            flowRate: 10,
          },
        },
        {
          commandType: 'waitForDuration',
          key: expect.any(String),
          params: { seconds: 11 },
        },
      ])
    })
  })
})

describe('transfer: return tip', () => {
  let allArgs: TransferArgs
  beforeEach(() => {
    allArgs = {
      ...mixinArgs,
      volume: 175,
      sourceWells: ['A1'],
      destWells: ['B1'],
      tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
      dropTipLocation: 'fixture/fixture_tiprack_300_ul/1',
      changeTip: 'always',
    } as TransferArgs
  })

  it('should return tip', () => {
    const args = {
      ...allArgs,
      changeTip: 'always',
    } as TransferArgs

    const result = transfer(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.python).toEqual(
      `
mock_pipette.transfer_with_liquid_class(
    volume=175,
    source=[mock_source_plate["A1"]],
    dest=[mock_dest_plate["B1"]],
    new_tip="always",
    return_tip=True,
    tip_racks=[mock_tip_rack_1, mock_tip_rack_2],
    liquid_class=protocol.define_liquid_class(
        name="transfer_step_1",
        properties={"p300_single": {"fixture/fixture_tiprack_300_ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 0, "y": 0, "z": 2},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 10)],
                "pre_wet": False,
                "correction_by_volume": [(0, 0)],
                "delay": {"enabled": False},
                "mix": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 50,
                    "start_position": {
                        "offset": {"x": 1, "y": 0, "z": 5},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 2, "y": -1, "z": -4},
                        "position_reference": "well-top",
                    },
                    "speed": 51,
                    "touch_tip": {"enabled": False},
                },
            },
            "dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 3},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 12)],
                "delay": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 52,
                    "start_position": {
                        "offset": {"x": 2, "y": 1, "z": -2},
                        "position_reference": "well-center",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 3, "y": -2, "z": -5},
                        "position_reference": "well-top",
                    },
                    "speed": 53,
                    "touch_tip": {"enabled": False},
                    "blowout": {"enabled": False},
                },
                "correction_by_volume": [(0, 0)],
                "push_out_by_volume": [(0, 0)],
                "mix": {"enabled": False},
            },
        }}},
    ),
)`.trimStart()
    )
  })
})

describe('transfer: select tip', () => {
  let allArgs: TransferArgs
  beforeEach(() => {
    allArgs = {
      ...mixinArgs,
      volume: 175,
      sourceWells: ['A1'],
      destWells: ['B1'],
      tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
      dropTipLocation: 'fixture/fixture_tiprack_300_ul/1',
      changeTip: 'always',
      tipTracking: MANUAL,
      tipsSelected: [['E5']],
      tiprackSelected: 'tiprack1Id',
    } as TransferArgs
  })

  it('should return tip', () => {
    const args = {
      ...allArgs,
      changeTip: 'always',
    } as TransferArgs

    const result = transfer(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.python).toEqual(
      `
mock_pipette.transfer_with_liquid_class(
    volume=175,
    source=[mock_source_plate["A1"]],
    dest=[mock_dest_plate["B1"]],
    new_tip="always",
    return_tip=True,
    tip_racks=[mock_tip_rack_1, mock_tip_rack_2],
    liquid_class=protocol.define_liquid_class(
        name="transfer_step_1",
        properties={"p300_single": {"fixture/fixture_tiprack_300_ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 0, "y": 0, "z": 2},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 10)],
                "pre_wet": False,
                "correction_by_volume": [(0, 0)],
                "delay": {"enabled": False},
                "mix": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 50,
                    "start_position": {
                        "offset": {"x": 1, "y": 0, "z": 5},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 2, "y": -1, "z": -4},
                        "position_reference": "well-top",
                    },
                    "speed": 51,
                    "touch_tip": {"enabled": False},
                },
            },
            "dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 3},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 12)],
                "delay": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 52,
                    "start_position": {
                        "offset": {"x": 2, "y": 1, "z": -2},
                        "position_reference": "well-center",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 3, "y": -2, "z": -5},
                        "position_reference": "well-top",
                    },
                    "speed": 53,
                    "touch_tip": {"enabled": False},
                    "blowout": {"enabled": False},
                },
                "correction_by_volume": [(0, 0)],
                "push_out_by_volume": [(0, 0)],
                "mix": {"enabled": False},
            },
        }}},
    ),
    tips=[mock_tip_rack_1["E5"]],
)`.trimStart()
    )
  })
})
