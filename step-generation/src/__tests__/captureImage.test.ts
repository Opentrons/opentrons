import { describe, expect, it } from 'vitest'

import { captureImage } from '../commandCreators/atomic/captureImage'
import { getSuccessResult } from '../fixtures'

import type { Height, Width } from '@opentrons/shared-data'

describe('captureImage', () => {
  it('should generate a captureImage command', () => {
    const invariantContext: any = {}
    const robotInitialState: any = {}
    const args = {
      homeBefore: true,
      fileName: 'fileName',
      resolution: [10, 10] as [Width, Height],
      zoom: 10,
      contrast: 10,
      brightness: 10,
      saturation: 10,
    }
    const result = captureImage(args, invariantContext, robotInitialState)
    const res = getSuccessResult(result)
    expect(res.python).toEqual(`protocol.capture_image()`)
  })
})
