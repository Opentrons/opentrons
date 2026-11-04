import flatMap from 'lodash/flatMap'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  FIXED_TRASH_ID,
  fixtureTiprack300ul,
  getLabwareDefURI,
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_CENTER,
} from '@opentrons/shared-data'

import { MANUAL } from '../../../constants'
import {
  blowoutHelper,
  DEFAULT_PIPETTE,
  delayCommand,
  DEST_LABWARE,
  getErrorResult,
  getFlowRateAndOffsetParamsMix,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeAspirateInPlaceHelper,
  makeContext,
  makeDispenseInPlaceHelper,
  makeTouchTipHelper,
  prepareAndConfigureCommands,
  replaceTipCommands,
  SOURCE_LABWARE,
} from '../../../fixtures'
import { mix } from '../mix'

import type {
  AspDispAirgapParams,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type {
  ChangeTipOptions,
  InvariantContext,
  MixArgs,
  RobotState,
} from '../../../types'

const aspirateInPlaceHelper = makeAspirateInPlaceHelper()
const dispenseInPlaceHelper = makeDispenseInPlaceHelper()
const touchTipHelper = makeTouchTipHelper()
// TODO: Ian 2019-06-14 more elegant way to test the blowout offset calculation
const BLOWOUT_OFFSET_ANY: any = expect.any(Number)

let invariantContext: InvariantContext
let robotStateWithTip: RobotState
let mixinArgs: Partial<MixArgs>

const mockWellLocation: Partial<AspDispAirgapParams> = {
  wellLocation: {
    origin: 'bottom',
    offset: { x: 0, y: 0, z: 3.2 },
  },
}

beforeEach(() => {
  mixinArgs = {
    ...getFlowRateAndOffsetParamsMix(),
    commandCreatorFnName: 'mix',
    name: 'mix test',
    description: 'test blah blah',
    tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
    pipette: DEFAULT_PIPETTE,
    primaryNozzle: 'A1',

    labware: SOURCE_LABWARE,

    blowoutLocation: null,
    touchTip: false,
    aspirateDelaySeconds: null,
    dispenseDelaySeconds: null,
    dropTipLocation: FIXED_TRASH_ID,
    positionReference: POSITION_REFERENCE_BOTTOM,
    xOffset: 0,
    yOffset: 0,
    zOffset: 3.2,
  }

  invariantContext = makeContext()
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
})

describe('mix: change tip', () => {
  const volume = 5
  const times = 2
  const makeArgs = (changeTip: ChangeTipOptions): MixArgs =>
    ({
      ...mixinArgs,
      volume,
      times,
      wells: ['A1', 'B1', 'C1'],
      changeTip,
    }) as MixArgs
  it('changeTip="always" with no advanced settings', () => {
    const args = makeArgs('always')
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well: string, idx: number) => [
        ...replaceTipCommands(idx),
        ...aspirateInPlaceHelper(
          {
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.1,
          },
          {
            pipetteId: 'p300SingleId',
            labwareId: SOURCE_LABWARE,
            wellName: well,
            wellLocation: mockWellLocation.wellLocation,
          },
          true
        ),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
          pushOut: 0,
        }),

        ...aspirateInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.1,
        }),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
        }),
      ])
    )
    expect(res.python).toBe(
      `
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=5,
    location=mock_source_plate["A1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=5,
    location=mock_source_plate["B1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=5,
    location=mock_source_plate["C1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)`.trimStart()
    )
  })

  it('changeTip="once"', () => {
    const args = makeArgs('once')
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      ...replaceTipCommands(0),
      ...flatMap(args.wells, well => [
        ...aspirateInPlaceHelper(
          {
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.1,
          },
          {
            pipetteId: 'p300SingleId',
            labwareId: SOURCE_LABWARE,
            wellName: well,
            wellLocation: mockWellLocation.wellLocation,
          },
          true
        ),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
          pushOut: 0,
        }),

        ...aspirateInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.1,
        }),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
        }),
      ]),
    ])
  })

  it('changeTip="never"', () => {
    const args = makeArgs('never')
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...aspirateInPlaceHelper(
          {
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.1,
          },
          {
            pipetteId: 'p300SingleId',
            labwareId: SOURCE_LABWARE,
            wellName: well,
            wellLocation: mockWellLocation.wellLocation,
          },
          true
        ),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
          pushOut: 0,
        }),
        ...aspirateInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.1,
        }),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
        }),
      ])
    )
  })
})

describe('mix: advanced options', () => {
  const volume = 8
  const times = 2
  const blowoutLabwareId = DEST_LABWARE

  it('flow rate', () => {
    const args = {
      ...mixinArgs,
      volume,
      times,
      wells: ['A1'],
      changeTip: 'once',
    } as MixArgs

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      ...replaceTipCommands(0),
      ...aspirateInPlaceHelper(
        {
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.1,
        },
        {
          pipetteId: 'p300SingleId',
          labwareId: SOURCE_LABWARE,
          wellName: 'A1',
          wellLocation: {
            origin: 'bottom',
            offset: {
              x: 0,
              y: 0,
              z: 3.2,
            },
          },
        },
        true
      ),
      ...dispenseInPlaceHelper({
        pipetteId: 'p300SingleId',
        volume,
        flowRate: 2.2,
        pushOut: 0,
      }),

      ...aspirateInPlaceHelper({
        pipetteId: 'p300SingleId',
        volume,
        flowRate: 2.1,
      }),
      ...dispenseInPlaceHelper({
        pipetteId: 'p300SingleId',
        volume,
        flowRate: 2.2,
      }),
    ])
  })

  it('touch tip (after each dispense)', () => {
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      touchTip: true,
      wells: ['A1', 'B1', 'C1'],
    } as MixArgs

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well: string, idx: number) => [
        ...replaceTipCommands(idx),
        ...aspirateInPlaceHelper(
          {
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.1,
          },
          {
            pipetteId: 'p300SingleId',
            labwareId: SOURCE_LABWARE,
            wellName: well,
            wellLocation: mockWellLocation.wellLocation,
          },
          true
        ),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
          pushOut: 0,
        }),

        ...aspirateInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.1,
        }),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
        }),
        touchTipHelper(well),
      ])
    )
  })

  it('blowout', () => {
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      blowoutLocation: 'source_well',
      wells: ['A1', 'B1', 'C1'],
    } as MixArgs

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...replaceTipCommands(idx),
        ...(idx > 0 ? prepareAndConfigureCommands() : []),
        ...aspirateInPlaceHelper(
          {
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.1,
          },
          {
            pipetteId: 'p300SingleId',
            labwareId: SOURCE_LABWARE,
            wellName: well,
            wellLocation: mockWellLocation.wellLocation,
          },

          true
        ),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
          pushOut: 0,
        }),

        ...aspirateInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.1,
        }),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
        }),
        blowoutHelper(blowoutLabwareId, {
          labwareId: 'sourcePlateId',
          wellName: well,
          wellLocation: {
            origin: 'top',
            offset: {
              z: BLOWOUT_OFFSET_ANY,
            },
          },
        }),
      ])
    )
  })

  it('touch tip after blowout', () => {
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      blowoutLocation: 'dest_well',
      touchTip: true,
      wells: ['A1'],
    } as MixArgs

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...replaceTipCommands(idx),
        ...(idx > 0 ? prepareAndConfigureCommands() : []),
        ...aspirateInPlaceHelper(
          {
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.1,
          },
          {
            pipetteId: 'p300SingleId',
            labwareId: SOURCE_LABWARE,
            wellName: well,
            wellLocation: mockWellLocation.wellLocation,
          },

          true
        ),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
          pushOut: 0,
        }),

        ...aspirateInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.1,
        }),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
        }),
        blowoutHelper(blowoutLabwareId, {
          labwareId: 'sourcePlateId',
          wellName: 'A1',
          wellLocation: {
            origin: 'top',
            offset: {
              z: BLOWOUT_OFFSET_ANY,
            },
          },
        }),
        touchTipHelper(well),
      ])
    )
  })
  it('should delay after aspirating', () => {
    const args: MixArgs = {
      ...mixinArgs,
      aspirateDelaySeconds: 12,
      volume,
      times,
      changeTip: 'always',
      wells: ['A1', 'B1', 'C1'],
    } as MixArgs

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...replaceTipCommands(idx),
        ...aspirateInPlaceHelper(
          {
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.1,
          },
          {
            pipetteId: 'p300SingleId',
            labwareId: SOURCE_LABWARE,
            wellName: well,
            wellLocation: mockWellLocation.wellLocation,
          },

          true
        ),
        delayCommand(12),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
          pushOut: 0,
        }),

        ...aspirateInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.1,
        }),
        delayCommand(12),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
        }),
      ])
    )
  })
  it('should delay after dispensing', () => {
    const args: MixArgs = {
      ...mixinArgs,
      dispenseDelaySeconds: 12,
      volume,
      times,
      changeTip: 'always',
      wells: ['A1', 'B1', 'C1'],
    } as MixArgs

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...replaceTipCommands(idx),
        ...aspirateInPlaceHelper(
          {
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.1,
          },
          {
            pipetteId: 'p300SingleId',
            labwareId: SOURCE_LABWARE,
            wellName: well,
            wellLocation: mockWellLocation.wellLocation,
          },

          true
        ),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
          pushOut: 0,
        }),
        delayCommand(12),

        ...aspirateInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.1,
        }),
        ...dispenseInPlaceHelper({
          pipetteId: 'p300SingleId',
          volume,
          flowRate: 2.2,
        }),
        delayCommand(12),
      ])
    )
  })
  describe('all advanced settings enabled', () => {
    it('should create commands in the expected order with expected params with all args', () => {
      const args: MixArgs = {
        ...mixinArgs,
        touchTip: true,
        aspirateDelaySeconds: 10,
        dispenseDelaySeconds: 12,
        blowoutLocation: 'source_well',
        volume,
        times,
        changeTip: 'always',
        wells: ['A1', 'B1', 'C1'],
        yOffset: 1,
        finalPushOut: 2,
      } as MixArgs
      const mockWellLocationCustomXY: Partial<AspDispAirgapParams> = {
        wellLocation: {
          origin: 'bottom',
          offset: { x: 0, y: 1, z: 3.2 },
        },
      }

      const result = mix(args, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)

      expect(res.commands).toEqual(
        flatMap(args.wells, (well, idx) => [
          ...replaceTipCommands(idx),
          ...(idx > 0 ? prepareAndConfigureCommands() : []),
          ...aspirateInPlaceHelper(
            {
              pipetteId: 'p300SingleId',
              volume,
              flowRate: 2.1,
            },
            {
              pipetteId: 'p300SingleId',
              labwareId: SOURCE_LABWARE,
              wellName: well,
              wellLocation: mockWellLocationCustomXY.wellLocation,
            },

            true
          ),
          delayCommand(10),
          ...dispenseInPlaceHelper({
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.2,
            pushOut: 0,
          }),
          delayCommand(12),

          ...aspirateInPlaceHelper({
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.1,
          }),
          delayCommand(10),
          ...dispenseInPlaceHelper({
            pipetteId: 'p300SingleId',
            volume,
            flowRate: 2.2,
            pushOut: 2,
          }),
          delayCommand(12),
          blowoutHelper(blowoutLabwareId, {
            labwareId: 'sourcePlateId',
            wellName: well,
            wellLocation: {
              origin: 'top',
              offset: {
                z: BLOWOUT_OFFSET_ANY,
              },
            },
          }),
          touchTipHelper(well),
        ])
      )
      expect(res.python).toBe(
        `
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["A1"].bottom(z=3.2).move(types.Point(y=1)),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
    aspirate_delay=10,
    dispense_delay=12,
    final_push_out=2,
)
mock_pipette.flow_rate.blow_out = 2.3
mock_pipette.blow_out(mock_source_plate["A1"].top(z=3.3))
mock_pipette.touch_tip(mock_source_plate["A1"], v_offset=-3.4)
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.prepare_to_aspirate()
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["B1"].bottom(z=3.2).move(types.Point(y=1)),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
    aspirate_delay=10,
    dispense_delay=12,
    final_push_out=2,
)
mock_pipette.flow_rate.blow_out = 2.3
mock_pipette.blow_out(mock_source_plate["B1"].top(z=3.3))
mock_pipette.touch_tip(mock_source_plate["B1"], v_offset=-3.4)
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.prepare_to_aspirate()
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["C1"].bottom(z=3.2).move(types.Point(y=1)),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
    aspirate_delay=10,
    dispense_delay=12,
    final_push_out=2,
)
mock_pipette.flow_rate.blow_out = 2.3
mock_pipette.blow_out(mock_source_plate["C1"].top(z=3.3))
mock_pipette.touch_tip(mock_source_plate["C1"], v_offset=-3.4)
`.trim()
      )
    })
  })
  it('should create python commands with mix() with touchTip and blowOut and no delay or x/y offset set', () => {
    const args: MixArgs = {
      ...mixinArgs,
      touchTip: true,
      blowoutLocation: 'dest_well',
      volume,
      times,
      changeTip: 'always',
      wells: ['A1', 'B1', 'C1'],
      positionReference: POSITION_REFERENCE_CENTER,
      xOffset: 1,
      yOffset: 1,
    } as MixArgs

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.python).toBe(
      `
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["A1"].center().move(types.Point(x=1, y=1, z=3.2)),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.flow_rate.blow_out = 2.3
mock_pipette.blow_out(mock_source_plate["A1"].top(z=3.3))
mock_pipette.touch_tip(mock_source_plate["A1"], v_offset=-3.4)
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.prepare_to_aspirate()
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["B1"].center().move(types.Point(x=1, y=1, z=3.2)),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.flow_rate.blow_out = 2.3
mock_pipette.blow_out(mock_source_plate["B1"].top(z=3.3))
mock_pipette.touch_tip(mock_source_plate["B1"], v_offset=-3.4)
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.prepare_to_aspirate()
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["C1"].center().move(types.Point(x=1, y=1, z=3.2)),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.flow_rate.blow_out = 2.3
mock_pipette.blow_out(mock_source_plate["C1"].top(z=3.3))
mock_pipette.touch_tip(mock_source_plate["C1"], v_offset=-3.4)
`.trim()
    )
  })
})

describe('mix: errors', () => {
  let errorArgs: Partial<MixArgs>
  beforeEach(() => {
    errorArgs = {
      ...mixinArgs,
      volume: 8,
      times: 2,
      changeTip: 'once',
      wells: ['A1', 'A2'],
    }
  })
  it('invalid labware', () => {
    const args: MixArgs = {
      ...errorArgs,
      labware: 'invalidLabwareId',
    } as MixArgs
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  it('invalid pipette', () => {
    const args: MixArgs = {
      ...errorArgs,
      pipette: 'invalidPipetteId',
    } as MixArgs
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'PIPETTE_DOES_NOT_EXIST',
    })
  })

  // TODO Ian 2018-05-08
  it.todo('"times" arg non-integer')
  it.todo('"times" arg negative')
})

describe('mix: return tip', () => {
  let args: MixArgs
  beforeEach(() => {
    args = {
      ...mixinArgs,
      volume: 8,
      times: 2,
      dropTipLocation: 'fixture/fixture_tiprack_300_ul/1',
      wells: ['A1', 'B1', 'C1'],
      changeTip: 'always',
    } as MixArgs
  })
  it('should return tip if changeTip is always', () => {
    args.dropTipLocation = 'fixture/fixture_tiprack_300_ul/1'
    args.wells = ['A1', 'B1', 'C1']
    args.changeTip = 'always'
    const result = mix(args, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).python).toBe(
      `mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["A1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip(location=mock_tip_rack_1["A1"])
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["B1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip(location=mock_tip_rack_1["B1"])
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["C1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip(location=mock_tip_rack_1["C1"])`
    )
  })
  it('should return tip if changeTip is once', () => {
    args.dropTipLocation = 'fixture/fixture_tiprack_300_ul/1'
    args.wells = ['A1', 'B1', 'C1']
    args.changeTip = 'once'
    const result = mix(args, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).python).toBe(
      `mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["A1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["B1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["C1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip(location=mock_tip_rack_1["A1"])`
    )
  })
})

describe('mix: select tip', () => {
  let args: MixArgs
  beforeEach(() => {
    args = {
      ...mixinArgs,
      volume: 8,
      times: 2,
      dropTipLocation: 'fixture/fixture_tiprack_300_ul/1',
      wells: ['A1', 'B1', 'C1'],
      changeTip: 'always',
    } as MixArgs
  })
  it('should select tips if tipTracking is manual', () => {
    args = {
      ...args,
      dropTipLocation: 'fixture/fixture_tiprack_300_ul/1',
      wells: ['A1', 'B1', 'C1'],
      changeTip: 'always',
      tipTracking: MANUAL,
      tipsSelected: [['E5'], ['F5'], ['G5']],
      tiprackSelected: 'tiprack1Id',
    }
    const result = mix(args, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).python).toBe(
      `mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1["E5"])
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["A1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip(location=mock_tip_rack_1["E5"])
mock_pipette.pick_up_tip(location=mock_tip_rack_1["F5"])
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["B1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip(location=mock_tip_rack_1["F5"])
mock_pipette.pick_up_tip(location=mock_tip_rack_1["G5"])
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["C1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip(location=mock_tip_rack_1["G5"])`
    )
  })
  it('should return tip if changeTip is once', () => {
    args.dropTipLocation = 'fixture/fixture_tiprack_300_ul/1'
    args.wells = ['A1', 'B1', 'C1']
    args.changeTip = 'once'
    const result = mix(args, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).python).toBe(
      `mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["A1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["B1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.mix(
    repetitions=2,
    volume=8,
    location=mock_source_plate["C1"].bottom(z=3.2),
    aspirate_flow_rate=2.1,
    dispense_flow_rate=2.2,
)
mock_pipette.drop_tip(location=mock_tip_rack_1["A1"])`
    )
  })
})
