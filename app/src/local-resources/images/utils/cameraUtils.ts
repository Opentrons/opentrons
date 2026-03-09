import type { CameraZoomSetting } from '../hooks/useCameraSettingsValues'

export function zoomNumberToString(value: number): CameraZoomSetting {
  return `${value}x` as CameraZoomSetting
}

export function zoomStringToNumber(value: string): number {
  return Number(value.replace(/x/i, ''))
}
