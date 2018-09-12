// @flow
import {createRobotState, createEmptyLiquidState, getTiprackTipstate} from './fixtures'

describe('createEmptyLiquidState fixture generator', () => {
  test('labware', () => {
    const result = createEmptyLiquidState({
      sourcePlateType: '96-flat',
      destPlateType: 'trough-12row',
      pipettes: {},
    })

    expect(Object.keys(result.labware)).toHaveLength(3) // 3 labwares: source, dest, trash

    expect(result.labware.sourcePlateId).toMatchObject({
      A1: {},
      B1: {},
      A2: {},
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
      A12: {},
    })

    expect(result.labware.trashId).toEqual({A1: {}})
  })
})

describe('createRobotState fixture generator', () => {
  describe('tip filling', () => {
    const tipFillingOptions = [true, false]

    tipFillingOptions.forEach(fillTiprackTips => {
      test('tiprack tips: ' + (fillTiprackTips ? 'full' : 'empty'), () => {
        const result = createRobotState({
          sourcePlateType: 'trough-12row',
          destPlateType: '96-flat',
          fillPipetteTips: false,
          fillTiprackTips,
          tipracks: [200, 200],
        })

        const tiprackIds = ['tiprack1Id', 'tiprack2Id']
        tiprackIds.forEach(tiprackId => {
          expect(result).toHaveProperty(`tipState.tipracks.${tiprackId}`)

          expect(result.tipState.tipracks[tiprackId]).toEqual(
            getTiprackTipstate(fillTiprackTips)
          )
        })
      })
    })

    tipFillingOptions.forEach(fillPipetteTips => {
      test('tiprack tips ' + (fillPipetteTips ? 'full' : 'empty'), () => {
        const result = createRobotState({
          sourcePlateType: 'trough-12row',
          destPlateType: '96-flat',
          fillPipetteTips,
          fillTiprackTips: true,
          tipracks: [200, 200],
        })

        const pipetteIds = ['p300SingleId', 'p300MultiId']
        pipetteIds.forEach(pipetteId => {
          expect(result).toHaveProperty(`tipState.pipettes.${pipetteId}`)
          expect(result.tipState.pipettes[pipetteId]).toEqual(fillPipetteTips)
        })
      })
    })
  })
})
