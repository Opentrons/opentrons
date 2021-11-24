import {
  CommonCommandInfo,
  LabwareDefinition2,
  LabwareOffset,
} from '../../../../js'

export interface LoadPipetteCommand extends CommonCommandInfo {
  commandType: 'loadPipette'
  params: LoadPipetteParams
  result?: LoadPipetteResult
}
export interface LoadLabwareCommand extends CommonCommandInfo {
  commandType: 'loadLabware'
  params: LoadLabwareParams
  result?: LoadLabwareResult
}
export interface LoadModuleCommand extends CommonCommandInfo {
  commandType: 'loadModule'
  params: LoadModuleParams
  result?: LoadModuleResult
}
export interface LoadLiquidCommand extends CommonCommandInfo {
  commandType: 'loadLiquid'
  params: LoadLiquidParams
  result?: LoadLiquidResult
}

export type SetupCommand =
  | LoadPipetteCommand
  | LoadLabwareCommand
  | LoadModuleCommand
  | LoadLiquidCommand

export type LabwareLocation = { slotName: string } | { moduleId: string }

export interface ModuleLocation {
  slotName: string
}
interface LoadPipetteParams {
  pipetteId: string
  mount: 'left' | 'right'
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
