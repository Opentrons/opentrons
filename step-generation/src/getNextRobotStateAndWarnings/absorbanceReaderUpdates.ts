import { ABSORBANCE_READER_TYPE } from '@opentrons/shared-data'

import { getModuleState } from '../robotStateSelectors'
import { resolveNumericRuntimeValue, resolveStringRuntimeValue } from '../utils'

import type {
  AbsorbanceReaderInitializeStepGenArgs,
  AbsorbanceReaderState,
  InvariantContext,
  ModuleStepGenArgs,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

const _getAbsorbanceReaderState = (
  robotState: RobotState,
  module: string
): AbsorbanceReaderState | null => {
  const moduleState = getModuleState(robotState, module)

  if (moduleState.type === ABSORBANCE_READER_TYPE) {
    return moduleState
  } else {
    console.error(
      `Absorbance reader state updater expected ${module} moduleState to be absorbanceReader, but it was ${moduleState.type}`
    )
    return null
  }
}

export const forAbsorbanceReaderOpenLid = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  if (moduleId == null) {
    return
  }
  const moduleState = _getAbsorbanceReaderState(robotState, moduleId)

  if (moduleState != null) {
    moduleState.lidOpen = true
  }
}

export const forAbsorbanceReaderCloseLid = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  if (moduleId == null) {
    return
  }
  const moduleState = _getAbsorbanceReaderState(robotState, moduleId)

  if (moduleState != null) {
    moduleState.lidOpen = false
  }
}

export const forAbsorbanceReaderInitialize = (
  params: AbsorbanceReaderInitializeStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { runtimeParameters } = invariantContext
  const { measureMode, sampleWavelengths, referenceWavelength } = params
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const measureModeValue = resolveStringRuntimeValue(
    measureMode,
    runtimeParameters
  )
  const resolvedMeasureMode =
    measureModeValue === 'single' || measureModeValue === 'multi'
      ? measureModeValue
      : null
  const resolvedSampleWavelengths = sampleWavelengths.map(wavelength =>
    resolveNumericRuntimeValue(wavelength, runtimeParameters)
  )
  const resolvedReferenceWavelength =
    referenceWavelength == null
      ? undefined
      : resolveNumericRuntimeValue(referenceWavelength, runtimeParameters)
  if (
    moduleId == null ||
    resolvedMeasureMode == null ||
    resolvedSampleWavelengths.some(wavelength => wavelength == null) ||
    resolvedReferenceWavelength === null
  ) {
    return
  }

  const moduleState = _getAbsorbanceReaderState(robotState, moduleId)
  if (moduleState != null) {
    moduleState.initialization = {
      mode: resolvedMeasureMode,
      wavelengths: resolvedSampleWavelengths as number[],
      referenceWavelength: resolvedReferenceWavelength,
    }
    moduleState.lidOpen = false
  }
}
