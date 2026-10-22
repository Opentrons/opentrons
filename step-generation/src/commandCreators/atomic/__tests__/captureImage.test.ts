import { describe, expect, it } from 'vitest'

import { getSuccessResult } from '../../../fixtures'
import { captureImage } from '../captureImage'

import type { Height, Width } from '@opentrons/shared-data'

describe('captureImage', () => {
  it('should generate a captureImage command', () => {
    const invariantContext: any = { runtimeParameters: {} }
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
    expect(res.python).toEqual(
      `protocol.capture_image(home_before=True, filename="fileName", resolution=(10, 10), zoom=10, contrast=10, brightness=10, saturation=10)`
    )
  })
  it('resolves homeBefore, fileName, resolution, zoom, contrast, brightness, and saturation when they are runtime parameters', () => {
    const invariantContext: any = {
      runtimeParameters: {
        home_before: {
          variableName: 'home_before',
          displayName: 'Home before',
          type: 'boolean',
          default: true,
        },
        file_name: {
          variableName: 'file_name',
          displayName: 'File name',
          type: 'string',
          default: 'fileName',
        },
        width: {
          variableName: 'width',
          displayName: 'Width',
          type: 'int',
          default: 10,
        },
        height: {
          variableName: 'height',
          displayName: 'Height',
          type: 'int',
          default: 10,
        },
        zoom: {
          variableName: 'zoom',
          displayName: 'Zoom',
          type: 'float',
          default: 10,
        },
        contrast: {
          variableName: 'contrast',
          displayName: 'Contrast',
          type: 'float',
          default: 10,
        },
        brightness: {
          variableName: 'brightness',
          displayName: 'Brightness',
          type: 'float',
          default: 10,
        },
        saturation: {
          variableName: 'saturation',
          displayName: 'Saturation',
          type: 'float',
          default: 10,
        },
      },
    }
    const result = captureImage(
      {
        homeBefore: 'home_before',
        fileName: 'file_name',
        resolution: ['width', 'height'],
        zoom: 'zoom',
        contrast: 'contrast',
        brightness: 'brightness',
        saturation: 'saturation',
      },
      invariantContext,
      {}
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'captureImage',
          key: expect.any(String),
          params: {
            homeBefore: true,
            fileName: 'fileName',
            resolution: [10, 10],
            zoom: 10,
            contrast: 10,
            brightness: 10,
            saturation: 10,
          },
        },
      ],
      python:
        'protocol.capture_image(home_before=home_before, filename=file_name, resolution=(width, height), zoom=zoom, contrast=contrast, brightness=brightness, saturation=saturation)',
    })
  })
})
