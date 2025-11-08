import type { CaptureImageArgs } from '@opentrons/step-generation'
import type { HydratedCameraFormData } from '/protocol-designer/form-types'
import type { GetCastFormData } from '../../fieldLevel'

export const cameraFormToArgs = (
  castFormData: GetCastFormData<HydratedCameraFormData>
): CaptureImageArgs => {
  const {
    homeBefore,
    fileName,
    resolution,
    zoom,
    contrast,
    brightness,
    saturation,
    stepDetails,
  } = castFormData

  return {
    commandCreatorFnName: 'captureImage',
    description: stepDetails,
    homeBefore,
    resolution,
    zoom,
    contrast,
    brightness,
    saturation,
    fileName: fileName ?? '',
  }
}
