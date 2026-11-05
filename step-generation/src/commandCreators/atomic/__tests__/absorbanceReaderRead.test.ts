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
import { absorbanceReaderRead } from '../absorbanceReaderRead'

import type {
  AbsorbanceReaderState,
  InvariantContext,
  RobotState,
} from '../../../types'

const moduleId = 'absorbanceReaderId'
vi.mock('../../../robotStateSelectors')

describe('absorbanceReaderRead', () => {
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
    robotState = getInitialRobotStateStandard(invariantContext)
    vi.mocked(absorbanceReaderStateGetter).mockReturnValue({
      initialization: {},
    } as AbsorbanceReaderState)
  })
  it('resolves moduleId and fileName when they are string runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: moduleId,
      },
      file_name: {
        variableName: 'file_name',
        displayName: 'File name',
        type: 'string',
        default: 'results.csv',
      },
    }
    const result = absorbanceReaderRead(
      {
        moduleId: 'selected_module',
        fileName: 'file_name',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'absorbanceReader/read',
          key: expect.any(String),
          params: {
            moduleId,
            fileName: 'results.csv',
          },
        },
      ],
      python: 'mock_absorbance_plate_reader_1.read(export_filename=file_name)',
    })
  })
  it('returns errors if moduleId and fileName are not string runtime parameters', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      mock_int_rtp: {
        variableName: 'mock_int_rtp',
        displayName: 'mock int rtp',
        type: 'int',
        default: 1,
      },
    }
    const result = absorbanceReaderRead(
      {
        moduleId: 'mock_rtp',
        fileName: 'mock_int_rtp',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
