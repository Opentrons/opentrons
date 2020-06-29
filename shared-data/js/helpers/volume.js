// @flow
// utilities for working with volumes in µL
import round from 'lodash/round'

import type { LabwareVolumeUnits } from '../types'

const SCALE_BY_UNITS = {
  µL: 1,
  mL: 1000,
  L: 1000000,
}

export function getDisplayVolume(
  volumeInMicroliters: number,
  displayUnits?: LabwareVolumeUnits = 'µL',
  digits?: number
): string {
  const volume = volumeInMicroliters / SCALE_BY_UNITS[displayUnits]

  return `${typeof digits === 'number' ? round(volume, digits) : volume}`
}

export function getAsciiVolumeUnits(displayUnits: LabwareVolumeUnits): string {
  if (displayUnits === 'µL') return 'uL'
  return displayUnits
}

export function ensureVolumeUnits(maybeUnits: ?string): LabwareVolumeUnits {
  if (maybeUnits === 'mL' || maybeUnits === 'ml') return 'mL'
  if (maybeUnits === 'L' || maybeUnits === 'l') return 'L'
  return 'µL'
}
