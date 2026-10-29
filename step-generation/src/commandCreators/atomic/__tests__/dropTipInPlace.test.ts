import { beforeEach, describe, expect, it } from 'vitest'

import { dropTipInPlace } from '..'
import { FIXED_TRASH_ID } from '../../../constants'
import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'

import type { DropTipInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

const p300SingleId = DEFAULT_PIPETTE

describe('dropTipInPlace', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('dropTip in place', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: {
        hasTip: true,
        tiprackURI: 'tiprackId',
      },
    }
    const params: DropTipInPlaceParams = {
      pipetteId: DEFAULT_PIPETTE,
    }
    const result = dropTipInPlace(params, invariantContext, {
      ...robotStateWithTip,
      pipettes: {
        ...robotStateWithTip.pipettes,
        [DEFAULT_PIPETTE]: {
          ...robotStateWithTip.pipettes[DEFAULT_PIPETTE],
          entityId: FIXED_TRASH_ID,
        },
      },
    })
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'dropTipInPlace',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
        },
      },
    ])
    expect(res.python).toBe(
      'mock_pipette.drop_tip(trash_bin_1, alternate_drop_location=True)'
    )
  })

  it('emits drop_tip() without a fixture when entityId is unset', () => {
    const params: DropTipInPlaceParams = {
      pipetteId: DEFAULT_PIPETTE,
    }
    const result = dropTipInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.python).toBe('mock_pipette.drop_tip()')
  })

  it('should no-op if there is no tip', () => {
    const params: DropTipInPlaceParams = {
      pipetteId: DEFAULT_PIPETTE,
    }
    const result = dropTipInPlace(params, invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([])
    expect(res.python).toBeUndefined()
  })
  it('resolves runtime parameters into the command and python', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: DEFAULT_PIPETTE,
      },
      home_after: {
        variableName: 'home_after',
        displayName: 'Home after',
        type: 'boolean',
        default: false,
      },
    }
    const result = dropTipInPlace(
      {
        pipetteId: 'selected_pipette',
        homeAfter: 'home_after',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'dropTipInPlace',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            homeAfter: false,
          },
        },
      ],
      python: 'mock_pipette.drop_tip(home_after=home_after)',
    })
  })
  it('returns errors if runtime parameters are not valid', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      mock_string_rtp: {
        variableName: 'mock_string_rtp',
        displayName: 'mock string rtp',
        type: 'string',
        default: 'mock',
      },
    }
    const result = dropTipInPlace(
      {
        pipetteId: 'mock_rtp',
        homeAfter: 'mock_string_rtp',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
