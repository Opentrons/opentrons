import { LabwareDefinition2, LabwareOffset } from '../../../../js'

export type SetupCommand =
  | {
      commandType: 'loadPipette'
      params: LoadPipetteParams
      result?: LoadPipetteResult
    }
  | {
      commandType: 'loadLabware'
      params: LoadLabwareParams
      result?: LoadLabwareResult
    }
  | {
      commandType: 'loadModule'
      params: LoadModuleParams
      result?: LoadModuleResult
    }
  | {
      commandType: 'loadLiquid'
      params: LoadLiquidParams
      result?: LoadLiquidResult
    }

type DeckLocation =
  | { slotId: string }
  | { coordinates: { x: number; y: number; z: number } }
  | null
interface LoadPipetteParams {
  pipetteId: string
  mount: string | null
}

interface LoadPipetteResult {
  pipetteId: string
}
interface LoadLabwareParams {
  labwareId: string
  location: DeckLocation
}

interface LoadLabwareResult {
  labwareId: string
  definition: LabwareDefinition2
  offset: LabwareOffset
}
interface LoadModuleParams {
  moduleId: string
  location: DeckLocation
}
interface LoadModuleResult {
  moduleId: string
}

interface LoadLiquidParams {
  liquidId: string
  labwareId: string
  volumeByWell: { [wellName: string]: number }
}

interface LoadLiquidResult {
  liquidId: string
}
