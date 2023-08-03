import type {
  CommonCommandRunTimeInfo,
  CommonCommandCreateInfo,
  LabwareDefinition2,
  LabwareOffset,
  PipetteName,
  ModuleModel,
} from '../../../../js'

export interface LoadPipetteCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadPipette'
  params: LoadPipetteParams
}
export interface LoadPipetteRunTimeCommand
  extends CommonCommandRunTimeInfo,
    Omit<LoadPipetteCreateCommand, 'params'> {
  params: LoadPipetteParams & {
    pipetteName: PipetteName
  }
  result?: LoadPipetteResult
}
export interface LoadLabwareCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadLabware'
  params: LoadLabwareParams
}
export interface LoadLabwareRunTimeCommand
  extends CommonCommandRunTimeInfo,
    LoadLabwareCreateCommand {
  result?: LoadLabwareResult
}
export interface MoveLabwareCreateCommand extends CommonCommandCreateInfo {
  commandType: 'moveLabware'
  params: MoveLabwareParams
}
export interface MoveLabwareRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveLabwareCreateCommand {
  result?: MoveLabwareResult
}
export interface LoadModuleCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadModule'
  params: LoadModuleParams
}
export interface LoadModuleRunTimeCommand
  extends CommonCommandRunTimeInfo,
    Omit<LoadModuleCreateCommand, 'params'> {
  params: LoadModuleParams & {
    model: ModuleModel
  }
  result?: LoadModuleResult
}
export interface LoadLiquidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadLiquid'
  params: LoadLiquidParams
}
export interface LoadLiquidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    LoadLiquidCreateCommand {
  result?: LoadLiquidResult
}

export type SetupRunTimeCommand =
  | LoadPipetteRunTimeCommand
  | LoadLabwareRunTimeCommand
  | LoadModuleRunTimeCommand
  | LoadLiquidRunTimeCommand
  | MoveLabwareRunTimeCommand
export type SetupCreateCommand =
  | LoadPipetteCreateCommand
  | LoadLabwareCreateCommand
  | LoadModuleCreateCommand
  | LoadLiquidCreateCommand
  | MoveLabwareCreateCommand

export type LabwareLocation =
  | { slotName: string }
  | { moduleId: string }
  | 'offDeck'

export type LabwareMovementStrategy =
  | 'usingGripper'
  | 'manualMoveWithPause'
  | 'manualMoveWithoutPause'

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
  displayName?: string
}
interface LoadLabwareResult {
  labwareId: string
  definition: LabwareDefinition2
  offset: LabwareOffset
}
export interface MoveLabwareParams {
  labwareId: string
  newLocation: LabwareLocation
  strategy: LabwareMovementStrategy
}
interface MoveLabwareResult {
  offsetId: string
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
