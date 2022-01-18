import {
  CommonCommandRunTimeInfo,
  LabwareDefinition2,
  LabwareOffset,
} from '../../../../js'

export interface LoadPipetteCreateCommand {
  commandType: 'loadPipette'
  params: LoadPipetteParams
}
export interface LoadPipetteRunTimeCommand
  extends CommonCommandRunTimeInfo,
    LoadPipetteCreateCommand {
  result: LoadPipetteResult
}
export interface LoadLabwareCreateCommand {
  commandType: 'loadLabware'
  params: LoadLabwareParams
}
export interface LoadLabwareRunTimeCommand
  extends CommonCommandRunTimeInfo,
    LoadLabwareCreateCommand {
  result: LoadLabwareResult
}
export interface LoadModuleCreateCommand {
  commandType: 'loadModule'
  params: LoadModuleParams
}
export interface LoadModuleRunTimeCommand
  extends CommonCommandRunTimeInfo,
    LoadModuleCreateCommand {
  result: LoadModuleResult
}
export interface LoadLiquidCreateCommand {
  commandType: 'loadLiquid'
  params: LoadLiquidParams
}
export interface LoadLiquidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    LoadLiquidCreateCommand {
  result: LoadLiquidResult
}

export type SetupRunTimeCommand =
  | LoadPipetteRunTimeCommand
  | LoadLabwareRunTimeCommand
  | LoadModuleRunTimeCommand
  | LoadLiquidRunTimeCommand
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
