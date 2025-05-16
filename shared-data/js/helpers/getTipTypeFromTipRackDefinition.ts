import type { LabwareDefinition } from '..'

export function getTipTypeFromTipRackDefinition(
  tipRackDef: LabwareDefinition
): string {
  const tipVolume = Object.values(tipRackDef.wells)[0].totalLiquidVolume
  const tipType = `t${tipVolume}`
  return tipType
}
