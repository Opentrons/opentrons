import { beforeEach, describe, expect, it } from 'vitest'

import {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
} from '@opentrons/shared-data'

import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
} from '../../../fixtures'
import { absorbanceReaderInitialize } from '../absorbanceReaderInitialize'

import type { InvariantContext, RobotState } from '../../../types'

const moduleId = 'absorbanceReaderId'

describe('absorbanceReaderInitialize', () => {
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
  })
  it('resolves all args when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: moduleId,
      },
      measure_mode: {
        variableName: 'measure_mode',
        displayName: 'Measure mode',
        type: 'string',
        default: 'single',
      },
      sample_wavelength: {
        variableName: 'sample_wavelength',
        displayName: 'Sample wavelength',
        type: 'int',
        default: 450,
      },
      reference_wavelength: {
        variableName: 'reference_wavelength',
        displayName: 'Reference wavelength',
        type: 'int',
        default: 600,
      },
    }
    const result = absorbanceReaderInitialize(
      {
        moduleId: 'selected_module',
        measureMode: 'measure_mode',
        sampleWavelengths: ['sample_wavelength'],
        referenceWavelength: 'reference_wavelength',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'absorbanceReader/initialize',
          key: expect.any(String),
          params: {
            moduleId,
            measureMode: 'single',
            sampleWavelengths: [450],
            referenceWavelength: 600,
          },
        },
      ],
      python:
        'mock_absorbance_plate_reader_1.initialize(measure_mode, [sample_wavelength], reference_wavelength=reference_wavelength)',
    })
  })
  it('returns errors if runtime parameters are missing or invalid', () => {
    invariantContext.runtimeParameters = {
      measure_mode: {
        variableName: 'measure_mode',
        displayName: 'Measure mode',
        type: 'string',
        default: 'bad_mode',
      },
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
    }
    const result = absorbanceReaderInitialize(
      {
        moduleId,
        measureMode: 'measure_mode',
        sampleWavelengths: [450, 'missing_wavelength'],
        referenceWavelength: 'mock_rtp',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "measure_mode" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_wavelength" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
