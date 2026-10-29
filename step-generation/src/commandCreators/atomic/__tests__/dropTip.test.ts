import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getSuccessResult,
  makeContext,
  makeState,
  makeStateArgsStandard,
} from '../../../fixtures'
import { dropTip } from '../dropTip'

import type { InvariantContext, RobotState } from '../../../types'

const mockDropTipLocation = 'mockLocation'
describe('dropTip', () => {
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
  })

  // TODO Ian 2019-04-19: this is a ONE-OFF fixture
  function makeRobotState(args: {
    singleHasTips: boolean
    multiHasTips: boolean
  }): RobotState {
    const _robotState = makeState({
      ...makeStateArgsStandard(),
      invariantContext,
      tiprackSetting: {
        tiprack1Id: true,
      },
    })

    _robotState.tipState.pipettes.p300SingleId = {
      hasTip: args.singleHasTips,
      tiprackURI: 'tiprackId',
    }
    _robotState.tipState.pipettes.p300MultiId = {
      hasTip: args.multiHasTips,
      tiprackURI: 'tiprackId',
    }
    return _robotState
  }

  describe('replaceTip: single channel', () => {
    it('drop tip if there is a tip', () => {
      const result = dropTip(
        {
          pipette: DEFAULT_PIPETTE,
          dropTipLocation: mockDropTipLocation,
          wellName: 'A1',
        },
        invariantContext,
        makeRobotState({
          singleHasTips: true,
          multiHasTips: true,
        })
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        {
          commandType: 'dropTip',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            labwareId: 'mockLocation',
            wellName: 'A1',
          },
        },
      ])
    })
    it('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({
        singleHasTips: false,
        multiHasTips: true,
      })
      const result = dropTip(
        {
          pipette: DEFAULT_PIPETTE,
          dropTipLocation: mockDropTipLocation,
        },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([])
    })
  })
  describe('Multi-channel dropTip', () => {
    it('drop tip if there is a tip', () => {
      const result = dropTip(
        {
          pipette: 'p300MultiId',
          dropTipLocation: mockDropTipLocation,
          wellName: 'A1',
        },
        invariantContext,
        makeRobotState({
          singleHasTips: true,
          multiHasTips: true,
        })
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        {
          commandType: 'dropTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300MultiId',
            labwareId: 'mockLocation',
            wellName: 'A1',
          },
        },
      ])
    })
    it('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: false,
      })
      const result = dropTip(
        {
          pipette: 'p300MultiId',
          dropTipLocation: mockDropTipLocation,
        },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([])
    })
  })

  describe('return tip', () => {
    it('returns tip if there is a tip', () => {
      const robotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })
      const robotStateForReturnTip = {
        ...robotState,
        pipettes: {
          ...robotState.pipettes,
          p300SingleId: {
            ...robotState.pipettes.p300SingleId,
            tipWell: 'A1',
            tiprackId: 'tiprack1Id',
          },
        },
      }
      const result = dropTip(
        {
          pipette: 'p300SingleId',
          isReturnTip: true,
        },
        invariantContext,
        robotStateForReturnTip
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        {
          commandType: 'dropTip',
          key: expect.any(String),
          params: {
            pipetteId: 'p300SingleId',
            labwareId: 'tiprack1Id',
            wellName: 'A1',
          },
        },
      ])
    })

    it('returns correct python if there is a tip', () => {
      const robotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })
      const robotStateForReturnTip = {
        ...robotState,
        pipettes: {
          ...robotState.pipettes,
          p300SingleId: {
            ...robotState.pipettes.p300SingleId,
            tipWell: 'A1',
            tiprackId: 'tiprack1Id',
          },
        },
      }
      const result = dropTip(
        {
          pipette: 'p300SingleId',
          isReturnTip: 'return_tip',
        },
        {
          ...invariantContext,
          runtimeParameters: {
            return_tip: {
              variableName: 'return_tip',
              displayName: 'Return tip',
              type: 'boolean',
              default: true,
            },
          },
        },
        robotStateForReturnTip
      )
      const res = getSuccessResult(result)
      expect(res.python).toEqual(
        'mock_pipette.drop_tip(location=mock_tip_rack_1["A1"])'
      )
    })

    it('raises error if most recent tip well is unknown', () => {
      const robotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })
      const robotStateForReturnTip = {
        ...robotState,
        pipettes: {
          ...robotState.pipettes,
          p300SingleId: {
            ...robotState.pipettes.p300SingleId,
            tiprackId: 'tiprack1Id',
          },
        },
      }

      const result = dropTip(
        {
          pipette: 'p300SingleId',
          isReturnTip: true,
        },
        invariantContext,
        robotStateForReturnTip
      )
      const res = getErrorResult(result)
      expect(res.errors[0].type).toEqual('RETURN_TIP_UNAVAILABLE')
    })

    it('raises error if most recent tip rack is unknown', () => {
      const robotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })
      const robotStateForReturnTip = {
        ...robotState,
        pipettes: {
          ...robotState.pipettes,
          p300SingleId: {
            ...robotState.pipettes.p300SingleId,
            tipWell: 'A1',
            tiprackId: undefined,
          },
        },
      }

      const result = dropTip(
        {
          pipette: 'p300SingleId',
          isReturnTip: true,
        },
        invariantContext,
        robotStateForReturnTip
      )
      const res = getErrorResult(result)
      expect(res.errors[0].type).toEqual('RETURN_TIP_UNAVAILABLE')
    })
  })
  it('resolves pipette, dropTipLocation, and wellName when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: DEFAULT_PIPETTE,
      },
      drop_location: {
        variableName: 'drop_location',
        displayName: 'Drop location',
        type: 'string',
        default: mockDropTipLocation,
      },
      selected_well: {
        variableName: 'selected_well',
        displayName: 'Selected well',
        type: 'string',
        default: 'A1',
      },
    }
    const result = dropTip(
      {
        pipette: 'selected_pipette',
        dropTipLocation: 'drop_location',
        wellName: 'selected_well',
      },
      invariantContext,
      makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'dropTip',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            labwareId: mockDropTipLocation,
            wellName: 'A1',
          },
        },
      ],
    })
  })
  it('returns errors if pipette, dropTipLocation, and wellName are not string runtime parameters', () => {
    invariantContext.runtimeParameters = {
      mock_pipette: {
        variableName: 'mock_pipette',
        displayName: 'mock pipette',
        type: 'boolean',
        default: false,
      },
      mock_location: {
        variableName: 'mock_location',
        displayName: 'mock location',
        type: 'int',
        default: 1,
      },
      mock_well: {
        variableName: 'mock_well',
        displayName: 'mock well',
        type: 'float',
        default: 1.5,
      },
    }
    const result = dropTip(
      {
        pipette: 'mock_pipette',
        dropTipLocation: 'mock_location',
        wellName: 'mock_well',
      },
      invariantContext,
      makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_pipette" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_location" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_well" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
