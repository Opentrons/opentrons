import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { useCameraImageSettings } from '@opentrons/react-api-client'

import { getCameraImageSettings } from '/app/redux/protocol-runs'

import { zoomNumberToString, zoomStringToNumber } from '../utils/cameraUtils'

import type { State } from '/app/redux/types'

export type CameraZoomSetting = '1x' | '1.5x' | '2x'

export interface UseCameraSettingsValuesResult {
  zoom: number
  brightness: number
  contrast: number
  saturation: number
  adjustZoom: (value: CameraZoomSetting) => void
  adjustBrightness: (value: number) => void
  adjustContrast: (value: number) => void
  adjustSaturation: (value: number) => void
  restoreToDefault: () => void
}

// Camera image specific settings.
export function useCameraSettingsValues(
  runId: string | null
): UseCameraSettingsValuesResult {
  const { data: cameraImageSettingsGlobal } = useCameraImageSettings()
  const cameraImageSettingsRun = useSelector((state: State) =>
    getCameraImageSettings(state, runId ?? '', 'ot_system_camera')
  )
  const cameraImageSettings =
    runId != null ? cameraImageSettingsRun : cameraImageSettingsGlobal

  const [zoom, setZoom] = useState<CameraZoomSetting>('1x')
  const zoomValue = zoomStringToNumber(zoom)
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
  }

  const adjustBrightness = (value: number): void => {
    setBrightness(value)
  }

  const adjustContrast = (value: number): void => {
    setContrast(value)
  }

  const adjustSaturation = (value: number): void => {
    setSaturation(value)
  }

  const restoreToDefault = (): void => {
    setBrightness(50)
    setContrast(50)
    setSaturation(50)
    setZoom('1x')
  }

  return {
    zoom: zoomValue,
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
