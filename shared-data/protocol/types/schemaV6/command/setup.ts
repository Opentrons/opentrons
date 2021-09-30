export type SetupCommand =
  | { commandType: 'loadPipette'; params: LoadPipetteParams }
  | { commandType: 'loadLabware'; params: LoadLabwareParams }
  | { commandType: 'loadModule'; params: LoadModuleParams }
  | { commandType: 'loadLiquid'; params: LoadLiquidParams }

type DeckLocation =
  | { slotId: string }
  | { coordinates: { x: number; y: number; z: number } }
  | null
interface LoadPipetteParams {
  pipetteId: string
  mount: string | null
}
interface LoadLabwareParams {
  labwareId: string
  location: DeckLocation
}
interface LoadModuleParams {
  moduleId: string
  location: DeckLocation
}
interface LoadLiquidParams {
  liquidId: string
  labwareId: string
  volumeByWell: { [wellName: string]: number }
}
