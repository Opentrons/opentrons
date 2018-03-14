// @flow
import {createRobotState, createEmptyLiquidState, filledTiprackWells, emptyTiprackWells} from './fixtures'

describe('createEmptyLiquidState fixture generator', () => {
  test('labware', () => {
    const result = createEmptyLiquidState({
      sourcePlateType: '96-flat',
      destPlateType: 'trough-12row',
      pipettes: {}
    })

    expect(Object.keys(result.labware)).toHaveLength(3) // 3 labwares: source, dest, trash

    expect(result.labware.sourcePlateId).toMatchObject({
      A1: {},
      B1: {},
      A2: {}
    })

    expect(Object.keys(result.labware.sourcePlateId)).toHaveLength(96)

    expect(result.labware.destPlateId).toEqual({
      A1: {},
      A2: {},
      A3: {},
      A4: {},
      A5: {},
      A6: {},
      A7: {},
      A8: {},
      A9: {},
      A10: {},
      A11: {},
      A12: {}
    })

    expect(result.labware.trashId).toEqual({A1: {}})
  })
})

// TODO IMMEDIATELY: update to use refactored createRobotStateFixture fn
describe.skip('createRobotState fixture generator', () => {
  describe('tip filling', () => {
    const tipFillingOptions = ['full', 'empty']

    tipFillingOptions.forEach(fillTiprackTips => {
      test('tiprack tips: ' + fillTiprackTips, () => {
        const result = createRobotState({
          labware: {tiprack1: {type: 'tiprack-200ul', slot: '1', name: ''}},
          pipetteTips: 'empty',
          tiprackTips: fillTiprackTips
        })

        expect(result).toHaveProperty('tipState.tipracks.tiprack1')
        expect(result.tipState.tipracks['tiprack1']).toEqual(fillTiprackTips === 'full'
          ? filledTiprackWells
          : emptyTiprackWells
        )
      })
    })

    tipFillingOptions.forEach(fillPipetteTips => {
      test('tiprack tips ' + fillPipetteTips, () => {
        const result = createRobotState({
          labware: {},
          leftPipette: 'p300Single',
          rightPipette: 'p10Multi',
          pipetteTips: fillPipetteTips,
          tiprackTips: 'empty'
        })

        const tipIsFull = fillPipetteTips === 'full'

        expect(result).toHaveProperty('tipState.pipettes.left')
        expect(result.tipState.pipettes.left).toEqual({'0': tipIsFull})

        expect(result).toHaveProperty('tipState.pipettes.right')
        expect(result.tipState.pipettes.right).toEqual({
          '0': tipIsFull,
          '1': tipIsFull,
          '2': tipIsFull,
          '3': tipIsFull,
          '4': tipIsFull,
          '5': tipIsFull,
          '6': tipIsFull,
          '7': tipIsFull
        })
      })
    })
  })
})
