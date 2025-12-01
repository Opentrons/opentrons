import { useEffect, useState } from 'react'

import {
  useCreateCameraImageSettings,
  useUpdateCameraImageSettings,
} from '@opentrons/react-api-client'

export type CameraZoomSetting = '1x' | '1.5x' | '2x'

export interface UseCameraSettingsValuesResult {
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

export function zoomNumberToString(value: number): CameraZoomSetting {
  return `${value}x` as CameraZoomSetting
}

// Camera image specific settings.
export function useCameraSettingsValues(): UseCameraSettingsValuesResult {
  const { data: cameraImageSettings } = useCreateCameraImageSettings()
  const { mutateAsync: updateCameraImageSettings } =
    useUpdateCameraImageSettings()
  const [zoom, setZoom] = useState<CameraZoomSetting>('1x')
  const [brightness, setBrightness] = useState(50)
  const [contrast, setContrast] = useState(50)
  const [saturation, setSaturation] = useState(50)

  useEffect(() => {
    if (cameraImageSettings) {
      setZoom(
        cameraImageSettings.zoom != null
          ? zoomNumberToString(cameraImageSettings.zoom)
          : '1x'
      )
      setBrightness(cameraImageSettings.brightness ?? 50)
      setContrast(cameraImageSettings.contrast ?? 50)
      setSaturation(cameraImageSettings.saturation ?? 50)
    }
  }, [cameraImageSettings])

  const adjustZoom = (value: CameraZoomSetting): void => {
    setZoom(value)
    console.log('🚀 ~ adjustZoom ~ value:', value)
  }

  const adjustBrightness = (value: number): void => {
    setBrightness(value)
    console.log('🚀 ~ adjustBrightness ~ value:', value)
  }

  const adjustContrast = (value: number): void => {
    setContrast(value)
    console.log('🚀 ~ adjustContrast ~ value:', value)
  }

  const adjustSaturation = (value: number): void => {
    setSaturation(value)
    console.log('🚀 ~ adjustSaturation ~ value:', value)
  }

  const restoreToDefault = (): void => {
    setBrightness(50)
    setContrast(50)
    setSaturation(50)
    setZoom('1x')
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
