import type { LabwareDefinition2 } from '..'

export function getTipTypeFromTipRackDefinition(
  tipRackDef: LabwareDefinition2
): string {
  const tipVolume = Object.values(tipRackDef.wells)[0].totalLiquidVolume
  const tipType = `t${tipVolume}`
  return tipType
}
