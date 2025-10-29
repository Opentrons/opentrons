import type { TFunction } from 'i18next'
import type {
  CaptureImageRunTimeCommand,
  RobotDevicesRunTimeCommand,
} from '@opentrons/shared-data/command'
import type { HandlesCommands } from '../types'

export function getRobotDevicesCommandText({
  command,
  t,
}: HandlesCommands<RobotDevicesRunTimeCommand>): string {
  switch (command.commandType) {
    case 'captureImage': {
      return buildCaptureImageCmdText(command, t)
    }
  }
}

function buildCaptureImageCmdText(
  command: CaptureImageRunTimeCommand,
  t: TFunction
): string {
  const { resolution, zoom, contrast, brightness, saturation } = command.params

  const options = []

  if (resolution) {
    options.push(
      t('capture_image_resolution', {
        width: resolution[0],
        height: resolution[1],
      })
    )
  }
  if (zoom) {
    options.push(t('capture_image_zoom', { zoom }))
  }
  if (contrast) {
    options.push(t('capture_image_contrast', { contrast }))
  }
  if (brightness) {
    options.push(t('capture_image_brightness', { brightness }))
  }
  if (saturation) {
    options.push(t('capture_image_saturation', { saturation }))
  }
  if (options.length === 0) {
    return t('capture_image_simple')
  }

  return t('capture_image_with_options', {
    options: options.join(t('capture_image_list_separator')),
  })
}
