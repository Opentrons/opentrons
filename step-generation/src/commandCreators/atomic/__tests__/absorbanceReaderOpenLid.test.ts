import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
} from '@opentrons/shared-data'

import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
} from '../../../fixtures'
import { absorbanceReaderStateGetter } from '../../../robotStateSelectors'
import { absorbanceReaderOpenLid } from '../absorbanceReaderOpenLid'

import type {
  AbsorbanceReaderState,
  InvariantContext,
  RobotState,
} from '../../../types'

const moduleId = 'absorbanceReaderId'
const gripperId = 'gripperId'
vi.mock('../../../robotStateSelectors')

describe('absorbanceReaderOpenLid', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: ABSORBANCE_READER_TYPE,
      model: ABSORBANCE_READER_V1,
      pythonName: 'mock_absorbance_plate_reader_1',
    }
    invariantContext.gripperEntities[gripperId] = {
      id: gripperId,
    }

    robotState = getInitialRobotStateStandard(invariantContext)
    robotState.modules[moduleId] = {
      slot: 'D3',
      moduleState: {
        type: ABSORBANCE_READER_TYPE,
        initialization: null,
        lidOpen: false,
      },
    }
    vi.mocked(absorbanceReaderStateGetter).mockReturnValue(
      {} as AbsorbanceReaderState
    )
  })
  it('creates absorbance reader open lid command', () => {
    const result = absorbanceReaderOpenLid(
      {
        moduleId,
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'absorbanceReader/openLid',
          key: expect.any(String),
          params: {
            moduleId,
          },
        },
      ],
      python: 'mock_absorbance_plate_reader_1.open_lid()',
    })
  })
  it('creates returns error if bad module state', () => {
    vi.mocked(absorbanceReaderStateGetter).mockReturnValue(null)
    const result = absorbanceReaderOpenLid(
      {
        moduleId,
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'MISSING_MODULE',
    })
  })
  it('creates returns error if no gripper', () => {
    invariantContext.gripperEntities = {}
    const result = absorbanceReaderOpenLid(
      {
        moduleId,
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'ABSORBANCE_READER_NO_GRIPPER',
    })
  })
  it('resolves moduleId when it is a string runtime parameter', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: moduleId,
      },
    }
    const result = absorbanceReaderOpenLid(
      {
        moduleId: 'selected_module',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'absorbanceReader/openLid',
          key: expect.any(String),
          params: {
            moduleId,
          },
        },
      ],
      python: 'mock_absorbance_plate_reader_1.open_lid()',
    })
  })
  it('returns error if moduleId is not a string runtime parameter', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
    }
    const result = absorbanceReaderOpenLid(
      {
        moduleId: 'mock_rtp',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
