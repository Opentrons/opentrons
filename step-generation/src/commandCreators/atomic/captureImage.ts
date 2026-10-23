import * as errorCreators from '../../errorCreators'
import {
  formatPyRuntimeValue,
  PROTOCOL_CONTEXT_NAME,
  pythonRuntimeString,
  resolveBooleanRuntimeValue,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { CaptureImageCreateCommand } from '@opentrons/shared-data'
import type { CaptureImageArgs, CommandCreator } from '../../types'

export const captureImage: CommandCreator<
  Pick<
    CaptureImageArgs,
    | 'homeBefore'
    | 'fileName'
    | 'resolution'
    | 'zoom'
    | 'contrast'
    | 'brightness'
    | 'saturation'
  >
> = (args, invariantContext, prevRobotState) => {
  const { runtimeParameters } = invariantContext
  const { resolution } = args
  const homeBefore = resolveBooleanRuntimeValue(
    args.homeBefore,
    runtimeParameters
  )
  const fileName = resolveStringRuntimeValue(args.fileName, runtimeParameters)
  const width = resolveNumericRuntimeValue(resolution[0], runtimeParameters)
  const height = resolveNumericRuntimeValue(resolution[1], runtimeParameters)
  const zoom = resolveNumericRuntimeValue(args.zoom, runtimeParameters)
  const contrast = resolveNumericRuntimeValue(args.contrast, runtimeParameters)
  const brightness = resolveNumericRuntimeValue(
    args.brightness,
    runtimeParameters
  )
  const saturation = resolveNumericRuntimeValue(
    args.saturation,
    runtimeParameters
  )
  const rawValues = [
    args.homeBefore,
    args.fileName,
    resolution[0],
    resolution[1],
    args.zoom,
    args.contrast,
    args.brightness,
    args.saturation,
  ]
  const resolvedValues = [
    homeBefore,
    fileName,
    width,
    height,
    zoom,
    contrast,
    brightness,
    saturation,
  ]
  const errors = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] == null
      ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (
    errors.length > 0 ||
    homeBefore == null ||
    fileName == null ||
    width == null ||
    height == null ||
    zoom == null ||
    contrast == null ||
    brightness == null ||
    saturation == null
  ) {
    return { errors }
  }
  const command: CaptureImageCreateCommand = {
    commandType: 'captureImage',
    key: uuid(),
    params: {
      homeBefore,
      fileName,
      resolution: [width, height],
      zoom,
      contrast,
      brightness,
      saturation,
    },
  }
  const pythonArgs = [
    `home_before=${formatPyRuntimeValue(args.homeBefore)}`,
    `filename=${pythonRuntimeString(args.fileName, fileName, runtimeParameters)}`,
    `resolution=(${formatPyRuntimeValue(resolution[0])}, ${formatPyRuntimeValue(resolution[1])})`,
    `zoom=${formatPyRuntimeValue(args.zoom)}`,
    `contrast=${formatPyRuntimeValue(args.contrast)}`,
    `brightness=${formatPyRuntimeValue(args.brightness)}`,
    `saturation=${formatPyRuntimeValue(args.saturation)}`,
  ]
  const python = `${PROTOCOL_CONTEXT_NAME}.capture_image(${pythonArgs.join(', ')})`
  return {
    commands: [command],
    python,
  }
}
