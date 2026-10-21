import { describe, expect, it } from 'vitest'

import { getErrorResult, getSuccessResult } from '../../../fixtures'
import { captureImage } from '../captureImage'

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
  it('resolves runtime parameters into the command', () => {
    const invariantContext = {
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
        image_width: {
          variableName: 'image_width',
          displayName: 'Width',
          type: 'int',
          default: 10,
        },
        image_height: {
          variableName: 'image_height',
          displayName: 'Height',
          type: 'int',
          default: 10,
        },
        zoom: {
          variableName: 'zoom',
          displayName: 'Zoom',
          type: 'int',
          default: 10,
        },
        contrast: {
          variableName: 'contrast',
          displayName: 'Contrast',
          type: 'int',
          default: 10,
        },
        brightness: {
          variableName: 'brightness',
          displayName: 'Brightness',
          type: 'int',
          default: 10,
        },
        saturation: {
          variableName: 'saturation',
          displayName: 'Saturation',
          type: 'int',
          default: 10,
        },
      },
    }
    const result = captureImage(
      {
        homeBefore: 'home_before',
        fileName: 'file_name',
        resolution: ['image_width', 'image_height'],
        zoom: 'zoom',
        contrast: 'contrast',
        brightness: 'brightness',
        saturation: 'saturation',
      },
      invariantContext as any,
      {} as any
    )
    expect(result).toEqual({
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
      python: 'protocol.capture_image()',
    })
  })
  it('returns errors if runtime parameters are not valid', () => {
    const invariantContext = {
      runtimeParameters: {
        mock_rtp: {
          variableName: 'mock_rtp',
          displayName: 'mock rtp',
          type: 'boolean',
          default: false,
        },
        mock_string_rtp: {
          variableName: 'mock_string_rtp',
          displayName: 'mock string rtp',
          type: 'string',
          default: 'mock',
        },
      },
    }
    const result = captureImage(
      {
        homeBefore: 'mock_string_rtp',
        fileName: 'mock_rtp',
        resolution: ['mock_string_rtp', 'mock_rtp'],
        zoom: 'mock_rtp',
      },
      invariantContext as any,
      {} as any
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
