import type {
  AddressableAreaName,
  AspirateProperties,
  CommonCommandCreateInfo,
  CommonCommandRunTimeInfo,
  LabwareDefinition,
  LabwareOffset,
  ModuleModel,
  MultiDispenseProperties,
  PipetteName,
  SingleDispenseProperties,
} from '../../js'

export interface LoadPipetteCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadPipette'
  params: LoadPipetteParams
}
export interface LoadPipetteRunTimeCommand
  extends CommonCommandRunTimeInfo, Omit<LoadPipetteCreateCommand, 'params'> {
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
  extends CommonCommandRunTimeInfo, LoadLabwareCreateCommand {
  result?: LoadLabwareResult
}
export interface LoadLidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadLid'
  params: LoadLidParams
}
export interface LoadLidRunTimeCommand
  extends CommonCommandRunTimeInfo, LoadLidCreateCommand {
  result?: LoadLidResult
}
export interface LoadLidStackCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadLidStack'
  params: LoadLidStackParams
}
export interface LoadLidStackRunTimeCommand
  extends CommonCommandRunTimeInfo, LoadLidStackCreateCommand {
  result?: LoadLidStackResult
}
export interface ReloadLabwareCreateCommand extends CommonCommandCreateInfo {
  commandType: 'reloadLabware'
  params: { labwareId: string }
}
export interface ReloadLabwareRunTimeCommand
  extends CommonCommandRunTimeInfo, ReloadLabwareCreateCommand {
  result?: ReloadLabwareResult
}
export interface MoveLabwareCreateCommand extends CommonCommandCreateInfo {
  commandType: 'moveLabware'
  params: MoveLabwareParams
}
export interface MoveLabwareRunTimeCommand
  extends CommonCommandRunTimeInfo, MoveLabwareCreateCommand {
  result?: MoveLabwareResult
}
export interface LoadModuleCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadModule'
  params: LoadModuleParams
}
export interface LoadModuleRunTimeCommand
  extends CommonCommandRunTimeInfo, Omit<LoadModuleCreateCommand, 'params'> {
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
  extends CommonCommandRunTimeInfo, LoadLiquidCreateCommand {
  result?: LoadLiquidResult
}

export interface LoadLiquidClassCreateCommand extends CommonCommandCreateInfo {
  commandType: 'loadLiquidClass'
  params: LoadLiquidClassParams
}
export interface LoadLiquidClassRunTimeCommand
  extends CommonCommandRunTimeInfo, LoadLiquidClassCreateCommand {
  result?: LoadLiquidClassResult
}

export interface ConfigureNozzleLayoutCreateCommand extends CommonCommandCreateInfo {
  commandType: 'configureNozzleLayout'
  params: ConfigureNozzleLayoutParams
}

export interface ConfigureNozzleLayoutRunTimeCommand
  extends CommonCommandRunTimeInfo, ConfigureNozzleLayoutCreateCommand {
  result?: {}
}

export interface SetTipStateCreateCommand extends CommonCommandCreateInfo {
  commandType: 'setTipState'
  params: SetTipStateParams
}

export interface SetTipStateRunTimeCommand
  extends CommonCommandRunTimeInfo, SetTipStateCreateCommand {
  result?: {}
}

export type SetupRunTimeCommand =
  | ConfigureNozzleLayoutRunTimeCommand
  | LoadPipetteRunTimeCommand
  | LoadLabwareRunTimeCommand
  | ReloadLabwareRunTimeCommand
  | LoadModuleRunTimeCommand
  | LoadLiquidRunTimeCommand
  | LoadLiquidClassRunTimeCommand
  | MoveLabwareRunTimeCommand
  | LoadLidRunTimeCommand
  | LoadLidStackRunTimeCommand
  | SetTipStateRunTimeCommand

export type SetupCreateCommand =
  | ConfigureNozzleLayoutCreateCommand
  | LoadPipetteCreateCommand
  | LoadLabwareCreateCommand
  | ReloadLabwareCreateCommand
  | LoadModuleCreateCommand
  | LoadLiquidCreateCommand
  | LoadLiquidClassCreateCommand
  | MoveLabwareCreateCommand
  | LoadLidCreateCommand
  | LoadLidStackCreateCommand
  | SetTipStateCreateCommand

export type LabwareLocation =
  | 'offDeck'
  | 'systemLocation'
  | 'wasteChuteLocation'
  | { slotName: string }
  | { moduleId: string }
  | { labwareId: string }
  | { addressableAreaName: AddressableAreaName }

export type LoadedLabwareLocation = LabwareLocation | InStackerHopperLocation

export type OnDeckLabwareLocation =
  | { slotName: string }
  | { moduleId: string }
  | { labwareId: string }
  | { addressableAreaName: AddressableAreaName }

export type NonStackedLocation =
  | 'offDeck'
  | { slotName: string }
  | { moduleId: string }
  | { addressableAreaName: AddressableAreaName }

export interface ModuleLocation {
  slotName: string
}

export interface InStackerHopperLocation {
  kind: 'inStackerHopper'
  moduleId: string
}

export interface OnLabwareLocationSequenceComponent {
  kind: 'onLabware'
  labwareId: string
  lidId: string | null
}

export interface OnModuleLocationSequenceComponent {
  kind: 'onModule'
  moduleId: string
}

export interface OnAddressableAreaLocationSequenceComponent {
  kind: 'onAddressableArea'
  addressableAreaName: AddressableAreaName
}

export interface NotOnDeckLocationSequenceComponent {
  kind: 'notOnDeck'
  logicalLocationName: 'offDeck' | 'systemLocation' | 'wasteChuteLocation'
}

export interface OnCutoutFixtureLocationSequenceComponent {
  kind: 'onCutoutFixture'
  cutoutId: string
  possibleCutoutFixtureIds: string[]
}

export type LocationSequenceComponent =
  | OnLabwareLocationSequenceComponent
  | OnModuleLocationSequenceComponent
  | OnAddressableAreaLocationSequenceComponent
  | NotOnDeckLocationSequenceComponent
  | OnCutoutFixtureLocationSequenceComponent
  | InStackerHopperLocation

export type LabwareLocationSequence = LocationSequenceComponent[]

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
  definition: LabwareDefinition
  // todo(mm, 2024-08-19): This does not match the server-returned offsetId field.
  // Confirm nothing client-side is trying to use this, then replace it with offsetId.
  offset: LabwareOffset
  locationSequence?: LabwareLocationSequence
}
interface ReloadLabwareResult {
  labwareId: string
  offsetId?: string | null
  locationSequence?: LabwareLocationSequence
}

export type LabwareMovementStrategy =
  'usingGripper' | 'manualMoveWithPause' | 'manualMoveWithoutPause'

export interface MoveLabwareParams {
  labwareId: string
  newLocation: LabwareLocation
  strategy: LabwareMovementStrategy
}
interface MoveLabwareResult {
  offsetId: string
  eventualDestinationLocationSequence?: LabwareLocationSequence
  immediateDestinationLocationSequence?: LabwareLocationSequence
  originLocationSequence?: LabwareLocationSequence
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
interface LoadLiquidClassParams {
  liquidClassId?: string
  liquidClassRecord: LiquidClassRecord
}

interface LiquidClassRecord {
  aspirate: AspirateProperties
  liquidClassName: string
  multiDispense?: MultiDispenseProperties
  pipetteModel: string
  singleDispense: SingleDispenseProperties
  tiprack: string
}

interface LoadLiquidClassResult {
  liquidClassId: string
}

export type PartialNozzles8Channel = 2 | 3 | 4 | 5 | 6 | 7
export type RowChannels = 12

export const PARTIAL_NOZZLE_MAP: Record<
  PartialPrimaryNozzles,
  PartialNozzles8Channel
> = {
  G1: 2,
  F1: 3,
  E1: 4,
  D1: 5,
  C1: 6,
  B1: 7,
} as const

export const COLUMN = 'COLUMN' as const
export const SINGLE = 'SINGLE' as const
export const ROW = 'ROW' as const
export const QUADRANT = 'QUADRANT' as const
export const ALL = 'ALL' as const
export const PARTIAL_COLUMN = 'PARTIAL_COLUMN' as const

export type NozzleConfigurationStyle =
  | typeof COLUMN
  | typeof SINGLE
  | typeof ROW
  | typeof QUADRANT
  | typeof ALL
  | typeof PARTIAL_COLUMN
export const A1_NOZZLE = 'A1' as const
export const A12_NOZZLE = 'A12' as const
export const H1_NOZZLE = 'H1' as const
export const H12_NOZZLE = 'H12' as const

export const G1_NOZZLE = 'G1' as const
export const E1_NOZZLE = 'E1' as const
export const F1_NOZZLE = 'F1' as const
export const D1_NOZZLE = 'D1' as const
export const C1_NOZZLE = 'C1' as const
export const B1_NOZZLE = 'B1' as const

export type PartialPrimaryNozzles =
  | typeof B1_NOZZLE
  | typeof C1_NOZZLE
  | typeof D1_NOZZLE
  | typeof E1_NOZZLE
  | typeof F1_NOZZLE
  | typeof G1_NOZZLE

export type PrimaryNozzleConfigurationStyle =
  | typeof A1_NOZZLE
  | PartialPrimaryNozzles
  | typeof A12_NOZZLE
  | typeof H1_NOZZLE
  | typeof H12_NOZZLE

export interface NozzleConfigurationParams {
  primaryNozzle?: PrimaryNozzleConfigurationStyle
  backLeftNozzle?: PartialPrimaryNozzles
  style: NozzleConfigurationStyle
}

export interface ConfigureNozzleLayoutParams {
  pipetteId: string
  configurationParams: NozzleConfigurationParams
}

interface LoadLidStackParams {
  location: LabwareLocation
  loadName: string
  namespace: string
  version: number
  quantity: number
}

interface LoadLidStackResult {
  stackLabwareId: string
  labwareIds: string[]
  definition?: LabwareDefinition
  lidStackDefinition: LabwareDefinition
  location: LabwareLocation
  stackLocationSequence?: LabwareLocationSequence
  locationSequences?: LabwareLocationSequence[]
}

export interface LoadLidParams {
  location: LabwareLocation
  loadName: string
  namespace: string
  version: number
}

interface LoadLidResult {
  labwareId: string
  definition: LabwareDefinition
  locationSequence?: LabwareLocationSequence
}

export type TipWellState = 'clean' | 'used' | 'empty'

export interface SetTipStateParams {
  labwareId: string
  wellNames: string[]
  tipWellState?: TipWellState
}
