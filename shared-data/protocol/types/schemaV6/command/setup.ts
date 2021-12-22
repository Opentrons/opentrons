import {
  CommonCommandInfo,
  LabwareDefinition2,
  LabwareOffset,
} from '../../../../js'

export interface LoadPipetteCreateCommand extends CommonCommandInfo {
  commandType: 'loadPipette'
  params: LoadPipetteParams
  result?: LoadPipetteResult
}
export interface LoadPipetteCommand extends LoadPipetteCreateCommand {
  key: string
}
export interface LoadLabwareCreateCommand extends CommonCommandInfo {
  commandType: 'loadLabware'
  params: LoadLabwareParams
  result?: LoadLabwareResult
}
export interface LoadLabwareCommand extends LoadLabwareCreateCommand {
  key: string
}
export interface LoadModuleCreateCommand extends CommonCommandInfo {
  commandType: 'loadModule'
  params: LoadModuleParams
  result?: LoadModuleResult
}
export interface LoadModuleCommand extends LoadModuleCreateCommand {
  key: string
}
export interface LoadLiquidCreateCommand extends CommonCommandInfo {
  commandType: 'loadLiquid'
  params: LoadLiquidParams
  result?: LoadLiquidResult
}
export interface LoadLiquidCommand extends LoadLiquidCreateCommand {
  key: string
}

export type SetupCommand =
  | LoadPipetteCommand
  | LoadLabwareCommand
  | LoadModuleCommand
  | LoadLiquidCommand
export type SetupCreateCommand =
  | LoadPipetteCreateCommand
  | LoadLabwareCreateCommand
  | LoadModuleCreateCommand
  | LoadLiquidCreateCommand

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
