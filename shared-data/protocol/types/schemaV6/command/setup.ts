export type SetupCommand =
  | { commandType: 'loadPipette'; params: LoadPipetteParams }
  | { commandType: 'loadLabware'; params: LoadLabwareParams }
  | { commandType: 'loadModule'; params: LoadModuleParams }
  | { commandType: 'loadLiquid'; params: LoadLiquidParams }

interface LoadPipetteParams {
  pipetteId: string
  mount: string | null
}
interface LoadLabwareParams {
  labwareId: string
  location: string | null
}
interface LoadModuleParams {
  moduleId: string
  location: string | null
}
interface LoadLiquidParams {
  liquidId: string
  labwareId: string
  volumeByWell: { [wellName: string]: number }
}
