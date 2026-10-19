import { beforeEach, describe, expect, it } from 'vitest'

import { prepareToAspirate } from '..'
import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'

import type { PrepareToAspirateParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

describe('prepareToAspirate', () => {
  let invariantContext: InvariantContext
  let robotStateWithTip: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('aspirate in place', () => {
    const params: PrepareToAspirateParams = {
      pipetteId: DEFAULT_PIPETTE,
    }
    const result = prepareToAspirate(
      params,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'prepareToAspirate',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
        },
      },
    ])
    expect(res.python).toBe('mock_pipette.prepare_to_aspirate()')
  })
  it('resolves pipetteId when it is a string runtime parameter', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: DEFAULT_PIPETTE,
      },
    }
    const result = prepareToAspirate(
      {
        pipetteId: 'selected_pipette',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'prepareToAspirate',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
          },
        },
      ],
      python: 'mock_pipette.prepare_to_aspirate()',
    })
  })
  it('returns error if pipetteId is not a string runtime parameter', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
    }
    const result = prepareToAspirate(
      {
        pipetteId: 'mock_rtp',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
