import * as errorCreators from '../../errorCreators'
import {
  formatPyStr,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  AbsorbanceReaderInitializeStepGenArgs,
  CommandCreator,
} from '../../types'

export const absorbanceReaderInitialize: CommandCreator<
  AbsorbanceReaderInitializeStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { sampleWavelengths, measureMode, referenceWavelength } = args
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
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

  const rawValues = [
    args.moduleId,
    measureMode,
    ...sampleWavelengths,
    referenceWavelength,
  ]
  const resolvedValues = [
    moduleId,
    resolvedMeasureMode,
    ...resolvedSampleWavelengths,
    resolvedReferenceWavelength,
  ]
  const errors = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] === null
      ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (errors.length > 0 || moduleId == null || resolvedMeasureMode == null) {
    return { errors }
  }

  const pythonName = invariantContext.moduleEntities[moduleId].pythonName
  const measureModePython =
    runtimeParameters[measureMode] != null
      ? measureMode
      : formatPyStr(measureMode)
  const referenceWavelengthPython =
    referenceWavelength != null
      ? `, reference_wavelength=${referenceWavelength}`
      : ''
  return {
    commands: [
      {
        commandType: 'absorbanceReader/initialize',
        key: uuid(),
        params: {
          moduleId,
          measureMode: resolvedMeasureMode,
          sampleWavelengths: resolvedSampleWavelengths as number[],
          ...(resolvedReferenceWavelength != null
            ? { referenceWavelength: resolvedReferenceWavelength }
            : {}),
        },
      },
    ],
    python: `${pythonName}.initialize(${measureModePython}, [${sampleWavelengths.join(
      ', '
    )}]${referenceWavelengthPython})`,
  }
}
