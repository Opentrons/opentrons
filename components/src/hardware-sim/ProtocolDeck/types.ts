export interface LabwareByLiquidId {
  [liquidId: string]: Array<{
    labwareId: string
    volumeByWell: { [well: string]: number }
  }>
}
