// @flow
import _aspirate from '../aspirate'
import {
  createRobotStateFixture,
  createRobotState,
  commandCreatorHasErrors,
  commandCreatorNoErrors,
} from './fixtures'
import updateLiquidState from '../aspirateUpdateLiquidState'

jest.mock('../aspirateUpdateLiquidState')

const aspirate = commandCreatorNoErrors(_aspirate)
const aspirateWithErrors = commandCreatorHasErrors(_aspirate)

const mockLiquidReturnValue = {
  // using strings instead of properly-shaped objects for easier assertions
  liquidState: 'expected liquid state',
  warnings: 'expected warnings',
}

beforeEach(() => {
  // $FlowFixMe
  updateLiquidState.mockReturnValue(mockLiquidReturnValue)
})

describe('aspirate', () => {
  let initialRobotState
  let robotStateWithTip

  beforeEach(() => {
    initialRobotState = createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      fillPipetteTips: false,
      fillTiprackTips: true,
      tipracks: [300, 300],
    })
    robotStateWithTip = createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      fillPipetteTips: 300,
      fillTiprackTips: true,
      tipracks: [300, 300],
    })
  })

  // Fixtures without liquidState key, for use with `toMatchObject`
  const robotStateWithTipNoLiquidState = createRobotStateFixture({
    sourcePlateType: 'trough-12row',
    destPlateType: '96-flat',
    fillPipetteTips: 300,
    fillTiprackTips: 300,
    tipracks: [300, 300],
  })

  test('aspirate with tip', () => {
    const result = aspirate({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.commands).toEqual([{
      command: 'aspirate',
      params: {
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1',
      },
    }])

    expect(result.robotState).toMatchObject(robotStateWithTipNoLiquidState)
  })

  test('aspirate with volume > tip max volume should throw error', () => {
    robotStateWithTip.tipState.pipettes['p300SingleId'].tipMaxVolume = 200
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 201,
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'TIP_VOLUME_EXCEEDED',
    })
  })

  test('aspirate with volume > pipette max volume should throw error', () => {
    robotStateWithTip.tipState.pipettes['p300SingleId'].tipMaxVolume = 9999
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 301,
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'PIPETTE_VOLUME_EXCEEDED',
    })
  })

  test('aspirate with invalid pipette ID should throw error', () => {
    const result = aspirateWithErrors({
      pipette: 'badPipette',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'PIPETTE_DOES_NOT_EXIST',
    })
  })

  test('aspirate with no tip should return error', () => {
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1',
    })(initialRobotState)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })

  test('aspirate from nonexistent labware should return error', () => {
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'problematicLabwareId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  describe('liquid tracking', () => {
    test('aspirate calls aspirateUpdateLiquidState with correct args and puts result into robotState.liquidState', () => {
      const result = aspirate({
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
        volume: 152,
      })(robotStateWithTip)

      expect(updateLiquidState).toHaveBeenCalledWith(
        {
          pipetteId: 'p300SingleId',
          labwareId: 'sourcePlateId',
          volume: 152,
          well: 'A1',
          labwareType: 'trough-12row',
          pipetteData: robotStateWithTip.instruments.p300SingleId,
        },
        robotStateWithTip.liquidState
      )

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue.liquidState)
      expect(result.warnings).toBe(mockLiquidReturnValue.warnings)
    })
  })
})
