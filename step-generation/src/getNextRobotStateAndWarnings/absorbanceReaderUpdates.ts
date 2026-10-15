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
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    console.error(
      `forAbsorbanceReaderOpenLid: arg resolved to null (moduleId=${String(
        moduleId
      )})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
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
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    console.error(
      `forAbsorbanceReaderCloseLid: arg resolved to null (moduleId=${String(
        moduleId
      )})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
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
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const measureModeValue = resolveStringRuntimeValue(
    params.measureMode,
    runtimeParameters
  )
  let measureMode: 'single' | 'multi' | null = null
  if (measureModeValue === 'single' || measureModeValue === 'multi') {
    measureMode = measureModeValue
  }
  const sampleWavelengths = params.sampleWavelengths.map(wavelength =>
    resolveNumericRuntimeValue(wavelength, runtimeParameters)
  )
  const referenceWavelength =
    params.referenceWavelength == null
      ? undefined
      : resolveNumericRuntimeValue(
          params.referenceWavelength,
          runtimeParameters
        )
  if (
    moduleId == null ||
    measureMode == null ||
    sampleWavelengths.some(wavelength => wavelength == null) ||
    referenceWavelength === null
  ) {
    console.error(
      `forAbsorbanceReaderInitialize: arg resolved to null (moduleId=${String(
        moduleId
      )}, measureMode=${String(measureMode)}, sampleWavelengths=${String(
        sampleWavelengths
      )}, referenceWavelength=${String(referenceWavelength)})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = _getAbsorbanceReaderState(robotState, moduleId)
  if (moduleState != null) {
    moduleState.initialization = {
      mode: measureMode,
      wavelengths: sampleWavelengths as number[],
      referenceWavelength,
    }
    moduleState.lidOpen = false
  }
}
