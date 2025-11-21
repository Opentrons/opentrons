import { describe, expect, it } from 'vitest'

import { cameraFormToArgs } from '../cameraFormToArgs'

import type { HydratedCameraFormData } from '/protocol-designer/form-types'
import type { GetCastFormData } from '/protocol-designer/steplist/fieldLevel'

describe('cameraFormToArgs', () => {
  it('returns the caputreImage command creator', () => {
    const formData: GetCastFormData<HydratedCameraFormData> = {
      stepNumber: 1,
      stepType: 'camera',
      stepDetails: 'details',
      stepName: 'captureImage',
      fileName: 'fileName',
      id: 'stepId',
      homeBefore: false,
      resolution: [10, 10],
      zoom: 2,
      contrast: 100,
      brightness: 100,
      saturation: 100,
    }
    const expected = {
      commandCreatorFnName: 'captureImage',
      description: 'details',
      homeBefore: false,
      resolution: [10, 10],
      zoom: 2,
      contrast: 100,
      brightness: 100,
      saturation: 100,
      fileName: 'fileName',
    }
    expect(cameraFormToArgs(formData)).toEqual(expected)
  })
})
