import { LabwareDefinition2, LabwareOffset } from '../../../../js'

export interface LoadPipetteCommand {
  commandType: 'loadPipette'
  params: LoadPipetteParams
  result?: LoadPipetteResult
}
export interface LoadLabwareCommand {
  commandType: 'loadLabware'
  params: LoadLabwareParams
  result?: LoadLabwareResult
}
export interface LoadModuleCommand {
  commandType: 'loadModule'
  params: LoadModuleParams
  result?: LoadModuleResult
}
export interface LoadLiquidCommand {
  commandType: 'loadLiquid'
  params: LoadLiquidParams
  result?: LoadLiquidResult
}

export type SetupCommand =
  | LoadPipetteCommand
  | LoadLabwareCommand
  | LoadModuleCommand
  | LoadLiquidCommand

type LabwareLocation = { slotName: string } | { moduleId: string }

interface ModuleLocation { slotName: string }
interface LoadPipetteParams {
  pipetteId: string
  mount: string | null
}

interface LoadPipetteResult {
  pipetteId: string
}
interface LoadLabwareParams {
  labwareId: string
  location: LabwareLocation
}

interface LoadLabwareResult {
  labwareId: string
  definition: LabwareDefinition2
  offset: LabwareOffset
}
interface LoadModuleParams {
  moduleId: string
  location: ModuleLocation
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
