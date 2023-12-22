import flatMap from 'lodash/flatMap'
import { FIXED_TRASH_ID } from '@opentrons/shared-data'
import { mix } from '../commandCreators/compound/mix'
import {
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  replaceTipCommands,
  getFlowRateAndOffsetParamsMix,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  makeAspirateHelper,
  makeDispenseHelper,
  blowoutHelper,
  makeTouchTipHelper,
  delayCommand,
} from '../fixtures'
import type {
  ChangeTipOptions,
  InvariantContext,
  MixArgs,
  RobotState,
} from '../types'

const aspirateHelper = makeAspirateHelper()
const dispenseHelper = makeDispenseHelper({ labwareId: SOURCE_LABWARE })
const touchTipHelper = makeTouchTipHelper()
// TODO: Ian 2019-06-14 more elegant way to test the blowout offset calculation
const BLOWOUT_OFFSET_ANY: any = expect.any(Number)

let invariantContext: InvariantContext
let robotStateWithTip: RobotState
let mixinArgs: Partial<MixArgs>

beforeEach(() => {
  mixinArgs = {
    ...getFlowRateAndOffsetParamsMix(),
    commandCreatorFnName: 'mix',
    name: 'mix test',
    description: 'test blah blah',
    tipRack: 'tiprack1Id',
    pipette: DEFAULT_PIPETTE,
    labware: SOURCE_LABWARE,

    blowoutLocation: null,
    touchTip: false,

    aspirateDelaySeconds: null,
    dispenseDelaySeconds: null,
    dropTipLocation: FIXED_TRASH_ID,
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
    } as MixArgs)
  it('changeTip="always"', () => {
    const args = makeArgs('always')
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well: string, idx: number) => [
        ...replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
      ])
    )
  })

  it('changeTip="once"', () => {
    const args = makeArgs('once')
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      ...replaceTipCommands(0),
      ...flatMap(args.wells, well => [
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
      ]),
    ])
  })

  it('changeTip="never"', () => {
    const args = makeArgs('never')
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, well => [
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
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
      aspirateHelper('A1', volume),
      dispenseHelper('A1', volume),
      aspirateHelper('A1', volume),
      dispenseHelper('A1', volume),
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
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
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
      blowoutLocation: blowoutLabwareId,
      wells: ['A1', 'B1', 'C1'],
    } as MixArgs

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        blowoutHelper(blowoutLabwareId, {
          wellLocation: {
            origin: 'bottom',
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
      blowoutLocation: blowoutLabwareId,
      touchTip: true,
      wells: ['A1', 'B1', 'C1'],
    } as MixArgs

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        blowoutHelper(blowoutLabwareId, {
          wellLocation: {
            origin: 'bottom',
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
        aspirateHelper(well, volume),
        delayCommand(12),
        dispenseHelper(well, volume),
        aspirateHelper(well, volume),
        delayCommand(12),
        dispenseHelper(well, volume),
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
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        delayCommand(12),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        delayCommand(12),
      ])
    )
  })
  describe('all advanced settings enabled', () => {
    it('should create commands in the expected order with expected params', () => {
      const args: MixArgs = {
        ...mixinArgs,
        touchTip: true,
        aspirateDelaySeconds: 10,
        dispenseDelaySeconds: 12,
        blowoutLocation: blowoutLabwareId,
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
          aspirateHelper(well, volume),
          delayCommand(10),
          dispenseHelper(well, volume),
          delayCommand(12),
          aspirateHelper(well, volume),
          delayCommand(10),
          dispenseHelper(well, volume),
          delayCommand(12),
          blowoutHelper(blowoutLabwareId, {
            wellLocation: {
              origin: 'bottom',
              offset: {
                z: BLOWOUT_OFFSET_ANY,
              },
            },
          }),
          touchTipHelper(well),
        ])
      )
    })
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
