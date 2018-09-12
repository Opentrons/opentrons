// @flow
import _mix from '../mix'
import {
  createRobotState,
  commandCreatorNoErrors,
  commandCreatorHasErrors,
  commandFixtures as cmd,
} from './fixtures'
import type {MixFormData} from '../types'
const mix = commandCreatorNoErrors(_mix)
const mixWithErrors = commandCreatorHasErrors(_mix)

let robotInitialState
let mixinArgs

beforeEach(() => {
  robotInitialState = createRobotState({
    sourcePlateType: '96-flat',
    destPlateType: '96-flat',
    tipracks: [200],
    fillPipetteTips: true,
    fillTiprackTips: true,
  })

  mixinArgs = {
    stepType: 'mix',
    name: 'mix test',
    description: 'test blah blah',

    pipette: 'p300SingleId',
    labware: 'sourcePlateId',

    delay: null,
    touchTip: false,
  }
})

describe('mix: change tip', () => {
  const volume = 5
  const times = 2
  const makeArgs = (changeTip): MixFormData => ({
    ...mixinArgs,
    volume,
    times,
    wells: ['A1', 'B1', 'C1'],
    changeTip,
  })
  test('changeTip="always"', () => {
    const args = makeArgs('always')
    const result = mix(args)(robotInitialState)

    expect(result.commands).toEqual([
      ...cmd.replaceTipCommands(0),
      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),

      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),

      ...cmd.replaceTipCommands(1),
      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),

      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),

      ...cmd.replaceTipCommands(2),
      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),

      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),
    ])
  })

  test('changeTip="once"', () => {
    const args = makeArgs('once')
    const result = mix(args)(robotInitialState)

    expect(result.commands).toEqual([
      ...cmd.replaceTipCommands(0),
      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),

      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),

      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),

      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),

      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),

      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),
    ])
  })

  test('changeTip="never"', () => {
    const args = makeArgs('never')
    const result = mix(args)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),

      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),

      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),

      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),

      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),

      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),
    ])
  })
})

describe('mix: advanced options', () => {
  const volume = 8
  const times = 2
  const blowoutLabwareId = 'destPlateId'

  test('touch tip (after each dispense)', () => {
    const args: MixFormData = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      touchTip: true,
      wells: ['A1', 'B1', 'C1'],
    }

    const result = mix(args)(robotInitialState)

    expect(result.commands).toEqual([
      ...cmd.replaceTipCommands(0),
      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),

      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),
      cmd.touchTip('A1'),

      ...cmd.replaceTipCommands(1),
      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),

      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),
      cmd.touchTip('B1'),

      ...cmd.replaceTipCommands(2),
      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),

      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),
      cmd.touchTip('C1'),
    ])
  })

  test('blowout', () => {
    const args: MixFormData = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      blowout: blowoutLabwareId,
      wells: ['A1', 'B1', 'C1'],
    }

    const result = mix(args)(robotInitialState)

    expect(result.commands).toEqual([
      ...cmd.replaceTipCommands(0),
      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),

      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),
      cmd.blowout(blowoutLabwareId),

      ...cmd.replaceTipCommands(1),
      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),

      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),
      cmd.blowout(blowoutLabwareId),

      ...cmd.replaceTipCommands(2),
      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),

      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),
      cmd.blowout(blowoutLabwareId),
    ])
  })

  test('touch tip after blowout', () => {
    const args: MixFormData = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      touchTip: true,
      blowout: blowoutLabwareId,
      wells: ['A1', 'B1', 'C1'],
    }

    const result = mix(args)(robotInitialState)

    expect(result.commands).toEqual([
      ...cmd.replaceTipCommands(0),
      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),

      cmd.aspirate('A1', volume),
      cmd.dispense('A1', volume),
      cmd.blowout(blowoutLabwareId),
      cmd.touchTip('A1'),

      ...cmd.replaceTipCommands(1),
      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),

      cmd.aspirate('B1', volume),
      cmd.dispense('B1', volume),
      cmd.blowout(blowoutLabwareId),
      cmd.touchTip('B1'),

      ...cmd.replaceTipCommands(2),
      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),

      cmd.aspirate('C1', volume),
      cmd.dispense('C1', volume),
      cmd.blowout(blowoutLabwareId),
      cmd.touchTip('C1'),
    ])
  })

  test.skip('delay') // TODO Ian 2018-05-08 implement when behavior is decided
})

describe('mix: errors', () => {
  let errorArgs = {}
  beforeEach(() => {
    errorArgs = {
      ...mixinArgs,
      volume: 8,
      times: 2,
      changeTip: 'once',
      wells: ['A1', 'A2'],
    }
  })
  test('invalid labware', () => {
    const args: MixFormData = {
      ...errorArgs,
      labware: 'invalidLabwareId',
    }
    const result = mixWithErrors(args)(robotInitialState)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  test('invalid pipette', () => {
    const args: MixFormData = {
      ...errorArgs,
      pipette: 'invalidPipetteId',
    }
    const result = mixWithErrors(args)(robotInitialState)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'PIPETTE_DOES_NOT_EXIST',
    })
  })

  // TODO Ian 2018-05-08
  test('"times" arg non-integer')
  test('"times" arg negative')
})
