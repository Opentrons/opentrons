import * as errorCreators from '../../errorCreators'
import {
  PROTOCOL_CONTEXT_NAME,
  resolveBooleanRuntimeValue,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { CaptureImageCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const captureImage: CommandCreator<{
  homeBefore?: boolean | string
  fileName?: string
  resolution?: [number | string, number | string]
  zoom?: number | string
  contrast?: number | string
  brightness?: number | string
  saturation?: number | string
}> = (args, invariantContext, prevRobotState) => {
  const runtimeParameters = invariantContext.runtimeParameters ?? {}
  const homeBefore =
    args.homeBefore == null
      ? undefined
      : resolveBooleanRuntimeValue(args.homeBefore, runtimeParameters)
  const fileName =
    args.fileName == null
      ? undefined
      : resolveStringRuntimeValue(args.fileName, runtimeParameters)
  const width =
    args.resolution == null
      ? undefined
      : resolveNumericRuntimeValue(args.resolution[0], runtimeParameters)
  const height =
    args.resolution == null
      ? undefined
      : resolveNumericRuntimeValue(args.resolution[1], runtimeParameters)
  const zoom =
    args.zoom == null
      ? undefined
      : resolveNumericRuntimeValue(args.zoom, runtimeParameters)
  const contrast =
    args.contrast == null
      ? undefined
      : resolveNumericRuntimeValue(args.contrast, runtimeParameters)
  const brightness =
    args.brightness == null
      ? undefined
      : resolveNumericRuntimeValue(args.brightness, runtimeParameters)
  const saturation =
    args.saturation == null
      ? undefined
      : resolveNumericRuntimeValue(args.saturation, runtimeParameters)
  const rawValues = [
    args.homeBefore,
    args.fileName,
    args.resolution?.[0],
    args.resolution?.[1],
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
  const errors: CommandCreatorError[] = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] == null
      ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (
    errors.length > 0 ||
    homeBefore === null ||
    fileName === null ||
    width === null ||
    height === null ||
    zoom === null ||
    contrast === null ||
    brightness === null ||
    saturation === null
  ) {
    return { errors }
  }
  const command: CaptureImageCreateCommand = {
    commandType: 'captureImage',
    key: uuid(),
    params: {
      homeBefore,
      fileName,
      ...(width != null && height != null
        ? { resolution: [width, height] }
        : {}),
      zoom,
      contrast,
      brightness,
      saturation,
    },
  }
  const python = `${PROTOCOL_CONTEXT_NAME}.capture_image()`
  return {
    commands: [command],
    python: python,
  }
}
