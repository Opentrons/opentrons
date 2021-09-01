export type SetupCommand =
  | { commandType: 'loadPipette'; params: LoadEntityParams }
  | { commandType: 'loadLabware'; params: LoadEntityParams }
  | { commandType: 'loadModule'; params: LoadEntityParams }
  | { commandType: 'loadLiquid'; params: LoadLiquidParams }

interface LoadEntityParams {
  entityId: string
  locationId: string
}

interface LoadLiquidParams {
  liquidId: string
  labwareId: string
  volumeByWell: { [wellId: string]: number }
}
