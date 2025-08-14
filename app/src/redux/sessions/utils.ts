import type { CalibrationLabwareSlot } from './types'

export function slotNameFromCalibrationSlot(
  calibrationLabwareSlot: CalibrationLabwareSlot
): string {
  const calSlot = (calibrationLabwareSlot as any) as string | number
  return typeof calSlot === 'string' ? calSlot : calSlot.toString()
}

export function calibrationSlotFromSlotName(
  slotName: string | number
): CalibrationLabwareSlot {
  return ((typeof slotName === 'string'
    ? slotName
    : slotName.toString()) as any) as CalibrationLabwareSlot
}
