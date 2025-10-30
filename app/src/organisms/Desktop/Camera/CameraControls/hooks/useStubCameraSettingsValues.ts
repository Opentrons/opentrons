import { useState } from 'react'

import { useCameraAnalytics } from '/app/redux-resources/analytics/'

export type CameraZoomSetting = '1x' | '1.5x' | '2x'

export interface UseStubCameraSettingsValuesResult {
  zoom: CameraZoomSetting
  brightness: number
  contrast: number
  saturation: number
  adjustZoom: (value: CameraZoomSetting) => void
  adjustBrightness: (value: number) => void
  adjustContrast: (value: number) => void
  adjustSaturation: (value: number) => void
  restoreToDefault: () => void
}

// Stubs camera-specific settings.
export function useStubCameraSettingsValues(): UseStubCameraSettingsValuesResult {
  const [zoom, setZoom] = useState<CameraZoomSetting>('1x')
  const [brightness, setBrightness] = useState(50)
  const [contrast, setContrast] = useState(50)
  const [saturation, setSaturation] = useState(50)
  const { reportCameraSettings } = useCameraAnalytics({})

  const adjustZoom = (value: CameraZoomSetting): void => {
    setZoom(value)
    reportCameraSettings({
      settingsType: 'zoom',
      value: value,
    })
  }

  const adjustBrightness = (value: number): void => {
    setBrightness(value)
    reportCameraSettings({
      settingsType: 'brightness',
      value: value,
    })
  }

  const adjustContrast = (value: number): void => {
    setContrast(value)
    reportCameraSettings({
      settingsType: 'contrast',
      value: value,
    })
  }

  const adjustSaturation = (value: number): void => {
    setSaturation(value)
    reportCameraSettings({
      settingsType: 'saturation',
      value: value,
    })
  }

  const restoreToDefault = (): void => {
    setBrightness(50)
    setContrast(50)
    setSaturation(50)
    setZoom('1x')
    reportCameraSettings({
      settingsType: 'zoom',
      value: '1x',
    })
    reportCameraSettings({
      settingsType: 'contrast',
      value: 50,
    })
    reportCameraSettings({
      settingsType: 'saturation',
      value: 50,
    })
    reportCameraSettings({
      settingsType: 'brightness',
      value: 50,
    })
  }

  return {
    zoom,
    brightness,
    contrast,
    saturation,
    adjustBrightness,
    adjustContrast,
    adjustSaturation,
    adjustZoom,
    restoreToDefault,
  }
}
