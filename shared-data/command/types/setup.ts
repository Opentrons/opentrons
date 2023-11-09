import type {
  CommonCommandRunTimeInfo,
  CommonCommandCreateInfo,
  LabwareDefinition2,
  LabwareOffset,
  PipetteName,
  ModuleModel,
  FixtureLoadName,
  Cutout,
} from '../../js'

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
//  TODO(jr, 10/31/23): update `loadFixture` to `loadAddressableArea`
export interface LoadFixtureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadFixture'
  params: LoadFixtureParams
}
export interface LoadFixtureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    LoadFixtureCreateCommand {
  result?: LoadLabwareResult
}

export type SetupRunTimeCommand =
  | LoadPipetteRunTimeCommand
  | LoadLabwareRunTimeCommand
  | LoadFixtureRunTimeCommand
  | LoadModuleRunTimeCommand
  | LoadLiquidRunTimeCommand
  | MoveLabwareRunTimeCommand

export type SetupCreateCommand =
  | LoadPipetteCreateCommand
  | LoadLabwareCreateCommand
  | LoadFixtureCreateCommand
  | LoadModuleCreateCommand
  | LoadLiquidCreateCommand
  | MoveLabwareCreateCommand

export type LabwareLocation =
  | 'offDeck'
  | { slotName: string }
  | { moduleId: string }
  | { labwareId: string }
  | { addressableAreaName: string }

export type NonStackedLocation =
  | 'offDeck'
  | { slotName: string }
  | { moduleId: string }
  | { addressableAreaName: string }

export interface ModuleLocation {
  slotName: string
}
export interface LoadPipetteParams {
  pipetteName: string
  pipetteId: string
  mount: 'left' | 'right'
}
interface LoadPipetteResult {
  pipetteId: string
}
interface LoadLabwareParams {
  location: LabwareLocation
  version: number
  namespace: string
  loadName: string
  displayName?: string
  labwareId?: string
}
interface LoadLabwareResult {
  labwareId: string
  definition: LabwareDefinition2
  offset: LabwareOffset
}

export type LabwareMovementStrategy =
  | 'usingGripper'
  | 'manualMoveWithPause'
  | 'manualMoveWithoutPause'

export interface MoveLabwareParams {
  labwareId: string
  newLocation: LabwareLocation
  strategy: LabwareMovementStrategy
}
interface MoveLabwareResult {
  offsetId: string
}

interface LoadModuleParams {
  moduleId?: string
  location: ModuleLocation
  model: ModuleModel
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

interface LoadFixtureParams {
  location: { cutout: Cutout }
  loadName: FixtureLoadName
  fixtureId?: string
}
