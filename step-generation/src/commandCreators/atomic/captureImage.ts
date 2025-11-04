import { PROTOCOL_CONTEXT_NAME, uuid } from '../../utils'

import type {
  CaptureImageCreateCommand,
  CaptureImageParams,
} from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const captureImage: CommandCreator<CaptureImageParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const command: CaptureImageCreateCommand = {
    commandType: 'captureImage',
    key: uuid(),
    params: {
      homeBefore: args.homeBefore,
      fileName: args.fileName,
      resolution: args.resolution,
      zoom: args.zoom,
      contrast: args.contrast,
      brightness: args.brightness,
      saturation: args.saturation,
    },
  }
  const python = `${PROTOCOL_CONTEXT_NAME}.captureImage()`
  return {
    commands: [command],
    python: python,
  }
}
