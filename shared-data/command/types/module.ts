import type {
  CommonCommandCreateInfo,
  CommonCommandRunTimeInfo,
  RunCommandFlexStackerError,
} from '.'
import type { LabwareDefinition, ModuleModel } from '../../js'
import type { LabwareLocationSequence } from './setup'

export type ModuleRunTimeCommand =
  | MagneticModuleEngageMagnetRunTimeCommand
  | MagneticModuleDisengageRunTimeCommand
  | TemperatureModuleSetTargetTemperatureRunTimeCommand
  | TemperatureModuleDeactivateRunTimeCommand
  | TemperatureModuleAwaitTemperatureRunTimeCommand
  | TCSetTargetBlockTemperatureRunTimeCommand
  | TCSetTargetLidTemperatureRunTimeCommand
  | TCWaitForBlockTemperatureRunTimeCommand
  | TCWaitForLidTemperatureRunTimeCommand
  | TCOpenLidRunTimeCommand
  | TCCloseLidRunTimeCommand
  | TCDeactivateBlockRunTimeCommand
  | TCDeactivateLidRunTimeCommand
  | TCRunProfileRunTimeCommand
  | TCStartRunExtendedProfileRunTimeCommand
  | TCRunExtendedProfileRunTimeCommand
  | TCAwaitProfileCompleteRunTimeCommand
  | HeaterShakerSetTargetTemperatureRunTimeCommand
  | HeaterShakerWaitForTemperatureRunTimeCommand
  | HeaterShakerSetAndWaitForShakeSpeedRunTimeCommand
  | HeaterShakerSetShakeSpeedRunTimeCommand
  | HeaterShakerOpenLatchRunTimeCommand
  | HeaterShakerCloseLatchRunTimeCommand
  | HeaterShakerDeactivateHeaterRunTimeCommand
  | HeaterShakerDeactivateShakerRunTimeCommand
  | AbsorbanceReaderOpenLidRunTimeCommand
  | AbsorbanceReaderCloseLidRunTimeCommand
  | AbsorbanceReaderInitializeRunTimeCommand
  | AbsorbanceReaderReadRunTimeCommand
  | FlexStackerEmptyRunTimeCommand
  | FlexStackerFillItemsRunTimeCommand
  | FlexStackerFillRunTimeCommand
  | FlexStackerRetrieveRunTimeCommand
  | FlexStackerSetStoredLabwareItemsRunTimeCommand
  | FlexStackerSetStoredLabwareRunTimeCommand
  | FlexStackerStoreRunTimeCommand
  | IdentifyModuleRunTimeCommand
  | VacuumModuleSetTargetPressureRunTimeCommand
  | VacuumModuleSetTargetPowerRunTimeCommand
  | VacuumModuleStopPumpRunTimeCommand
  | VacuumModuleOpenVentRunTimeCommand
  | VacuumModuleCloseVentRunTimeCommand
  | VacuumModuleStartRunProfileRunTimeCommand

export type ModuleCreateCommand =
  | MagneticModuleEngageMagnetCreateCommand
  | MagneticModuleDisengageCreateCommand
  | TemperatureModuleSetTargetTemperatureCreateCommand
  | TemperatureModuleDeactivateCreateCommand
  | TemperatureModuleAwaitTemperatureCreateCommand
  | TCSetTargetBlockTemperatureCreateCommand
  | TCSetTargetLidTemperatureCreateCommand
  | TCWaitForBlockTemperatureCreateCommand
  | TCWaitForLidTemperatureCreateCommand
  | TCOpenLidCreateCommand
  | TCCloseLidCreateCommand
  | TCDeactivateBlockCreateCommand
  | TCDeactivateLidCreateCommand
  | TCRunProfileCreateCommand
  | TCRunExtendedProfileCreateCommand
  | TCStartRunExtendedProfileCreateCommand
  | TCAwaitProfileCompleteCreateCommand
  | HeaterShakerWaitForTemperatureCreateCommand
  | HeaterShakerSetAndWaitForShakeSpeedCreateCommand
  | HeaterShakerSetShakeSpeedCreateCommand
  | HeaterShakerOpenLatchCreateCommand
  | HeaterShakerCloseLatchCreateCommand
  | HeaterShakerDeactivateHeaterCreateCommand
  | HeaterShakerDeactivateShakerCreateCommand
  | HeaterShakerSetTargetTemperatureCreateCommand
  | AbsorbanceReaderOpenLidCreateCommand
  | AbsorbanceReaderCloseLidCreateCommand
  | AbsorbanceReaderInitializeCreateCommand
  | AbsorbanceReaderReadCreateCommand
  | FlexStackerCloseLatch
  | FlexStackerEmptyCreateCommand
  | FlexStackerFillCreateCommand
  | FlexStackerFillItemsCreateCommand
  | FlexStackerOpenLatch
  | FlexStackerPrepareShuttleCreateCommand
  | FlexStackerRetrieveCreateCommand
  | FlexStackerSetStoredLabwareCreateCommand
  | FlexStackerSetStoredLabwareItemsCreateCommand
  | FlexStackerStoreCreateCommand
  | IdentifyModuleCreateCommand
  | VacuumModuleSetTargetPressureCreateCommand
  | VacuumModuleSetTargetPowerCreateCommand
  | VacuumModuleStopPumpCreateCommand
  | VacuumModuleOpenVentCreateCommand
  | VacuumModuleCloseVentCreateCommand
  | VacuumModuleStartRunProfileCreateCommand
export interface MagneticModuleEngageMagnetCreateCommand extends CommonCommandCreateInfo {
  commandType: 'magneticModule/engage'
  params: EngageMagnetParams
}
export interface MagneticModuleEngageMagnetRunTimeCommand
  extends CommonCommandRunTimeInfo, MagneticModuleEngageMagnetCreateCommand {
  result?: any
}
export interface MagneticModuleDisengageCreateCommand extends CommonCommandCreateInfo {
  commandType: 'magneticModule/disengage'
  params: ModuleOnlyParams
}
export interface MagneticModuleDisengageRunTimeCommand
  extends CommonCommandRunTimeInfo, MagneticModuleDisengageCreateCommand {
  result?: any
}
export interface TemperatureModuleSetTargetTemperatureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'temperatureModule/setTargetTemperature'
  params: TemperatureParams
}
export interface TemperatureModuleSetTargetTemperatureRunTimeCommand
  extends
    CommonCommandRunTimeInfo,
    TemperatureModuleSetTargetTemperatureCreateCommand {
  result?: any
}
export interface TemperatureModuleDeactivateCreateCommand extends CommonCommandCreateInfo {
  commandType: 'temperatureModule/deactivate'
  params: ModuleOnlyParams
}
export interface TemperatureModuleDeactivateRunTimeCommand
  extends CommonCommandRunTimeInfo, TemperatureModuleDeactivateCreateCommand {
  result?: any
}
export interface TemperatureModuleAwaitTemperatureParams {
  // same params as TemperatureParams except celsius is optional
  moduleId: string
  celsius?: number
}
export interface TemperatureModuleAwaitTemperatureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'temperatureModule/waitForTemperature'
  params: TemperatureModuleAwaitTemperatureParams
}
export interface TemperatureModuleAwaitTemperatureRunTimeCommand
  extends
    CommonCommandRunTimeInfo,
    TemperatureModuleAwaitTemperatureCreateCommand {
  result?: any
}
export interface TCSetTargetBlockTemperatureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/setTargetBlockTemperature'
  params: ThermocyclerSetTargetBlockTemperatureParams
}
export interface TCSetTargetBlockTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo, TCSetTargetBlockTemperatureCreateCommand {
  result?: any
}

export interface TCSetTargetLidTemperatureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/setTargetLidTemperature'
  params: TemperatureParams
}
export interface TCSetTargetLidTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo, TCSetTargetLidTemperatureCreateCommand {
  result?: any
}

export interface TCWaitForBlockTemperatureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/waitForBlockTemperature'
  params: ModuleOnlyParams
}
export interface TCWaitForBlockTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo, TCWaitForBlockTemperatureCreateCommand {
  result?: any
}
export interface TCWaitForLidTemperatureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/waitForLidTemperature'
  params: ModuleOnlyParams
}
export interface TCWaitForLidTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo, TCWaitForLidTemperatureCreateCommand {
  result?: any
}
export interface TCOpenLidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/openLid'
  params: ModuleOnlyParams
}
export interface TCOpenLidRunTimeCommand
  extends CommonCommandRunTimeInfo, TCOpenLidCreateCommand {
  result?: any
}
export interface TCCloseLidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/closeLid'
  params: ModuleOnlyParams
}
export interface TCCloseLidRunTimeCommand
  extends CommonCommandRunTimeInfo, TCCloseLidCreateCommand {
  result?: any
}
export interface TCDeactivateBlockCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/deactivateBlock'
  params: ModuleOnlyParams
}
export interface TCDeactivateBlockRunTimeCommand
  extends CommonCommandRunTimeInfo, TCDeactivateBlockCreateCommand {
  result?: any
}
export interface TCDeactivateLidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/deactivateLid'
  params: ModuleOnlyParams
}
export interface TCDeactivateLidRunTimeCommand
  extends CommonCommandRunTimeInfo, TCDeactivateLidCreateCommand {
  result?: any
}
export interface TCRunProfileCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/runProfile'
  params: TCProfileParams
}
export interface TCRunProfileRunTimeCommand
  extends CommonCommandRunTimeInfo, TCRunProfileCreateCommand {
  result?: any
}
export interface TCStartRunExtendedProfileCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/startRunExtendedProfile'
  params: TCStartExtendedProfileParams
}
export interface TCStartRunExtendedProfileRunTimeCommand
  extends CommonCommandRunTimeInfo, TCStartRunExtendedProfileCreateCommand {
  result?: any
}
export interface TCRunExtendedProfileCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/runExtendedProfile'
  params: TCExtendedProfileParams
}
export interface TCRunExtendedProfileRunTimeCommand
  extends CommonCommandRunTimeInfo, TCRunExtendedProfileCreateCommand {
  result?: any
}
export interface TCAwaitProfileCompleteCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/awaitProfileComplete'
  params: ModuleOnlyParams
}
export interface TCAwaitProfileCompleteRunTimeCommand
  extends CommonCommandRunTimeInfo, TCAwaitProfileCompleteCreateCommand {
  result?: any
}
export interface HeaterShakerSetTargetTemperatureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/setTargetTemperature'
  params: TemperatureParams
}
export interface HeaterShakerSetTargetTemperatureRunTimeCommand
  extends
    CommonCommandRunTimeInfo,
    HeaterShakerSetTargetTemperatureCreateCommand {
  result?: any
}
export interface HeaterShakerWaitForTemperatureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/waitForTemperature'
  params: ModuleOnlyParams
}
export interface HeaterShakerWaitForTemperatureRunTimeCommand
  extends
    CommonCommandRunTimeInfo,
    HeaterShakerWaitForTemperatureCreateCommand {
  result?: any
}
export interface HeaterShakerSetAndWaitForShakeSpeedCreateCommand extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/setAndWaitForShakeSpeed'
  params: ShakeSpeedParams
}
export interface HeaterShakerSetAndWaitForShakeSpeedRunTimeCommand
  extends
    CommonCommandRunTimeInfo,
    HeaterShakerSetAndWaitForShakeSpeedCreateCommand {
  result?: any
}
export interface HeaterShakerSetShakeSpeedCreateCommand extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/setShakeSpeed'
  params: ShakeSpeedParams
}
export interface HeaterShakerSetShakeSpeedRunTimeCommand
  extends CommonCommandRunTimeInfo, HeaterShakerSetShakeSpeedCreateCommand {
  result?: any
}
export interface HeaterShakerDeactivateHeaterCreateCommand extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/deactivateHeater'
  params: ModuleOnlyParams
}
export interface HeaterShakerDeactivateHeaterRunTimeCommand
  extends CommonCommandRunTimeInfo, HeaterShakerDeactivateHeaterCreateCommand {
  result?: any
}
export interface HeaterShakerOpenLatchCreateCommand extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/openLabwareLatch'
  params: ModuleOnlyParams
}
export interface HeaterShakerOpenLatchRunTimeCommand
  extends CommonCommandRunTimeInfo, HeaterShakerOpenLatchCreateCommand {
  result?: any
}
export interface HeaterShakerCloseLatchCreateCommand extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/closeLabwareLatch'
  params: ModuleOnlyParams
}
export interface HeaterShakerCloseLatchRunTimeCommand
  extends CommonCommandRunTimeInfo, HeaterShakerCloseLatchCreateCommand {
  result?: any
}
export interface HeaterShakerDeactivateShakerCreateCommand extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/deactivateShaker'
  params: ModuleOnlyParams
}
export interface HeaterShakerDeactivateShakerRunTimeCommand
  extends CommonCommandRunTimeInfo, HeaterShakerDeactivateShakerCreateCommand {
  result?: any
}
export interface AbsorbanceReaderOpenLidRunTimeCommand
  extends CommonCommandRunTimeInfo, AbsorbanceReaderOpenLidCreateCommand {
  result?: any
}
export interface AbsorbanceReaderCloseLidRunTimeCommand
  extends CommonCommandRunTimeInfo, AbsorbanceReaderCloseLidCreateCommand {
  result?: any
}
export interface AbsorbanceReaderInitializeRunTimeCommand
  extends CommonCommandRunTimeInfo, AbsorbanceReaderInitializeCreateCommand {
  result?: any
}
export interface AbsorbanceReaderReadRunTimeCommand
  extends CommonCommandRunTimeInfo, AbsorbanceReaderReadCreateCommand {
  result?: any
}
export interface AbsorbanceReaderOpenLidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'absorbanceReader/openLid'
  params: ModuleOnlyParams
}
export interface AbsorbanceReaderCloseLidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'absorbanceReader/closeLid'
  params: ModuleOnlyParams
}
export interface AbsorbanceReaderInitializeCreateCommand extends CommonCommandCreateInfo {
  commandType: 'absorbanceReader/initialize'
  params: AbsorbanceReaderInitializeParams
}
export interface AbsorbanceReaderReadCreateCommand extends CommonCommandCreateInfo {
  commandType: 'absorbanceReader/read'
  params: { moduleId: string; fileName?: string | null }
}
export interface EngageMagnetParams {
  moduleId: string
  height: number
}
export interface AbsorbanceReaderInitializeParams {
  moduleId: string
  measureMode: 'single' | 'multi'
  sampleWavelengths: number[]
  referenceWavelength?: number
}
export interface TemperatureParams {
  moduleId: string
  celsius: number
}
export interface ShakeSpeedParams {
  moduleId: string
  rpm: number
}

export interface AtomicProfileStep {
  holdSeconds: number
  celsius: number
}

export interface TCProfileParams {
  moduleId: string
  profile: AtomicProfileStep[]
  blockMaxVolumeUl?: number
}

// Vacuum Profile params (not finalized) (nd, 2026-04-23)
export interface AtomicVacuumProfileStepBase {
  holdSeconds: number
  enablePump: boolean
  holdTimeSeconds?: number
  holdTimeMinutes?: number
  rampRate?: number
  timeoutSeconds?: number
  ventAfter?: boolean
}

export interface AtomicVacuumProfileStepPressure extends AtomicVacuumProfileStepBase {
  gaugePressureMbar: number
}

export interface AtomicVacuumProfileStepPower extends AtomicVacuumProfileStepBase {
  percentPower: number
}

export type AtomicVacuumProfileStep =
  | AtomicVacuumProfileStepPressure
  | AtomicVacuumProfileStepPower

export interface VacuumProfileCycle {
  steps: AtomicVacuumProfileStep[]
  repetitions: number
  ventAfter?: boolean
}

export type VacuumProfile = Array<VacuumProfileCycle | AtomicVacuumProfileStep>
export interface VacuumRunProfileParams {
  moduleId: string
  steps: VacuumProfile
  taskId?: string
  ventAfter?: boolean
}

export interface ModuleOnlyParams {
  moduleId: string
}

export interface ThermocyclerSetTargetBlockTemperatureParams {
  moduleId: string
  celsius: number
  volume?: number
  holdTimeSeconds?: number
}

export interface TCProfileCycle {
  steps: AtomicProfileStep[]
  repetitions: number
}

export interface TCExtendedProfileParams {
  moduleId: string
  profileElements: Array<TCProfileCycle | AtomicProfileStep>
  blockMaxVolumeUl?: number
}

export interface TCStartExtendedProfileParams {
  moduleId: string
  profileElements: Array<TCProfileCycle | AtomicProfileStep>
  blockMaxVolumeUl?: number
  taskId?: string | null
}

export interface FlexStackerStoredLabwareDetails {
  loadName: string
  namespace: string
  version: number
}

export interface FlexStackerStoredLabwareGroup {
  primaryLabwareId: string
  adapterLabwareId: string | null
  lidLabwareId: string | null
}

interface StackerStoredLabwareLocationSequences {
  originalPrimaryLabwareLocationSequences?: LabwareLocationSequence[] | null
  originalAdapterLabwareLocationSequences?: LabwareLocationSequence[] | null
  originalLidLabwareLocationSequences?: LabwareLocationSequence[] | null
  newPrimaryLabwareLocationSequences?: LabwareLocationSequence[] | null
  newAdapterLabwareLocationSequences?: LabwareLocationSequence[] | null
  newLidLabwareLocationSequences?: LabwareLocationSequence[] | null
}

export interface StackerStoredLabwareDefinitionURIs {
  primaryLabwareURI: string
  adapterLabwareURI?: string | null
  lidLabwareURI?: string | null
}

export interface FlexStackerSetStoredLabwareParams {
  moduleId: string
  primaryLabware: FlexStackerStoredLabwareDetails
  lidLabware?: FlexStackerStoredLabwareDetails | null
  adapterLabware?: FlexStackerStoredLabwareDetails | null
  initialCount?: number | null
  initialStoredLabware?: FlexStackerStoredLabwareGroup[]
}

export interface FlexStackerSetStoredLabwareCreateCommand extends CommonCommandCreateInfo {
  commandType: 'flexStacker/setStoredLabware'
  params: FlexStackerSetStoredLabwareParams
}

export interface FlexStackerSetStoredLabwareRunTimeCommand
  extends FlexStackerSetStoredLabwareCreateCommand, CommonCommandRunTimeInfo {
  result?: {
    primaryLabwareDefinition: LabwareDefinition
    lidLabwareDefinition?: LabwareDefinition | null
    adapterLabwareDefinition?: LabwareDefinition | null
    count: number
    storedLabware: FlexStackerStoredLabwareGroup[]
  } & StackerStoredLabwareLocationSequences
}

export interface FlexStackerSetStoredLabwareItemsParams {
  moduleId: string
  labware: string[]
  stackingOffsetZ?: number
}
export interface FlexStackerSetStoredLabwareItemsCreateCommand extends CommonCommandCreateInfo {
  commandType: 'flexStacker/setStoredLabwareItems'
  params: FlexStackerSetStoredLabwareItemsParams
}

interface FlexStackerSetStoredLabwareResults {
  primaryLabwareDefinition: LabwareDefinition
  lidLabwareDefinition?: LabwareDefinition | null
  adapterLabwareDefinition?: LabwareDefinition | null
  count: number
  storedLabware: FlexStackerStoredLabwareGroup[]
}

export interface FlexStackerSetStoredLabwareItemsRunTimeCommand
  extends
    FlexStackerSetStoredLabwareItemsCreateCommand,
    CommonCommandRunTimeInfo {
  result?: FlexStackerSetStoredLabwareResults &
    StackerStoredLabwareLocationSequences
}

export interface FlexStackerRetrieveCreateCommand extends CommonCommandCreateInfo {
  commandType: 'flexStacker/retrieve'
  params: {
    moduleId: string
  }
}

export interface FlexStackerStoreCreateCommand extends CommonCommandCreateInfo {
  commandType: 'flexStacker/store'
  params: {
    moduleId: string
    strategy: 'automatic' | 'manual'
  }
}

export interface FlexStackerFillParams {
  moduleId: string
  strategy: 'manualWithPause' | 'logical'
  message?: string
  count?: number
  labwareToStore?: FlexStackerStoredLabwareGroup[]
}

export interface FlexStackerFillCreateCommand extends CommonCommandCreateInfo {
  commandType: 'flexStacker/fill'
  params: FlexStackerFillParams
}

export interface FlexStackerFillItemsParams {
  moduleId: string
  labware: string[]
  message?: string
}

export interface FlexStackerFillItemsCreateCommand extends CommonCommandCreateInfo {
  commandType: 'flexStacker/fillItems'
  params: FlexStackerFillItemsParams
}

export interface FlexStackerFillItemsRunTimeCommand
  extends FlexStackerFillItemsCreateCommand, CommonCommandRunTimeInfo {
  result?: {
    count: number
    storedLabware?: FlexStackerStoredLabwareGroup[] | null
    addedLabware?: FlexStackerStoredLabwareGroup[] | null
  } & StackerStoredLabwareLocationSequences &
    StackerStoredLabwareDefinitionURIs
}

export interface FlexStackerEmptyParams {
  moduleId: string
  strategy: 'manualWithPause' | 'logical'
  message?: string
  count?: number
}

export interface FlexStackerEmptyCreateCommand extends CommonCommandCreateInfo {
  commandType: 'flexStacker/empty'
  params: FlexStackerEmptyParams
}

export interface FlexStackerPrepareShuttleCreateCommand extends CommonCommandCreateInfo {
  commandType: 'flexStacker/prepareShuttle'
  params: {
    moduleId: string
    ignoreLatch?: boolean
  }
}

// TODO(tz, 4-17-2025): move under unsafe domain when BE has moved as well
export interface FlexStackerOpenLatch extends CommonCommandCreateInfo {
  commandType: 'flexStacker/openLatch'
  params: {
    moduleId: string
  }
}

export interface FlexStackerCloseLatch extends CommonCommandCreateInfo {
  commandType: 'flexStacker/closeLatch'
  params: {
    moduleId: string
  }
}

interface RetrieveResultPrimary {
  labwareId: string
  primaryLocationSequence: LabwareLocationSequence
  originalPrimaryLocationSequence: LabwareLocationSequence
  primaryLabwareURI: string
}

interface RetrieveResultNoLid {
  lidId?: null
  lidLocationSequence?: null
  originalLidLocationSequence?: null
  lidLabwareURI?: null
}

interface RetrieveResultLid {
  lidId: string
  lidLocationSequence: LabwareLocationSequence
  originalLidLocationSequence: LabwareLocationSequence
  lidLabwareURI: string
}

interface RetrieveResultAdapter {
  adapterId: string
  adapterLocationSequence: LabwareLocationSequence
  originalAdapterLocationSequence: LabwareLocationSequence
  adapterLabwareURI: string
}

interface RetrieveResultNoAdapter {
  adapterId?: null
  adapterLocationSequence?: null
  originalAdapterLocationSequence?: null
  adapterLabwareURI?: null
}

export interface FlexStackerRetrieveRunTimeCommand
  extends
    FlexStackerRetrieveCreateCommand,
    CommonCommandRunTimeInfo<RunCommandFlexStackerError> {
  result?:
    | (RetrieveResultPrimary & RetrieveResultNoLid & RetrieveResultNoAdapter)
    | (RetrieveResultPrimary & RetrieveResultLid & RetrieveResultNoAdapter)
    | (RetrieveResultPrimary & RetrieveResultNoLid & RetrieveResultAdapter)
    | (RetrieveResultPrimary & RetrieveResultAdapter & RetrieveResultLid)
}

export interface FlexStackerStoreRunTimeCommand
  extends
    FlexStackerStoreCreateCommand,
    CommonCommandRunTimeInfo<RunCommandFlexStackerError> {
  result?: {
    eventualDestinationLocationSequence?: LabwareLocationSequence
    primaryOriginLocationSequence?: LabwareLocationSequence
    primaryLabwareId?: string
    adapterOriginLocationSequence?: LabwareLocationSequence
    adapterLabwareId?: string
    lidOriginLocationSequence?: LabwareLocationSequence
    lidLabwareId?: LabwareLocationSequence
  } & StackerStoredLabwareDefinitionURIs
}

export interface FlexStackerFillRunTimeCommand
  extends FlexStackerFillCreateCommand, CommonCommandRunTimeInfo {
  result?: {
    count: number
    storedLabware?: FlexStackerStoredLabwareGroup[] | null
    addedLabware?: FlexStackerStoredLabwareGroup[] | null
  } & StackerStoredLabwareLocationSequences &
    StackerStoredLabwareDefinitionURIs
}

export interface FlexStackerEmptyRunTimeCommand
  extends FlexStackerEmptyCreateCommand, CommonCommandRunTimeInfo {
  result?: {
    count: number
    storedLabware?: FlexStackerStoredLabwareGroup[] | null
    removedLabware?: FlexStackerStoredLabwareGroup[] | null
  } & StackerStoredLabwareLocationSequences &
    StackerStoredLabwareDefinitionURIs
}

export type IdentifyColor = 'white' | 'red' | 'green' | 'blue' | 'yellow' | null

export interface IdentifyModuleCreateCommand extends CommonCommandCreateInfo {
  commandType: 'identifyModule'
  params: {
    model: ModuleModel
    moduleId: string
    start: boolean
    color?: IdentifyColor
  }
}

export interface IdentifyModuleRunTimeCommand
  extends CommonCommandRunTimeInfo, IdentifyModuleCreateCommand {
  result?: any
}

interface BaseVacuumModulePumpParams extends ModuleOnlyParams {
  // in seconds
  duration?: number
  // in mbar/s
  rate?: number
  // in seconds
  timeout?: number
  ventAfter?: boolean
  // in seconds; wait for atmospheric after venting
  equalizeTimeout?: number
  taskId?: string | null
}

interface VacuumModuleSetTargetPressureParams extends BaseVacuumModulePumpParams {
  // in mbar
  gaugePressure: number
}

interface VacuumModuleSetTargetPowerParams extends BaseVacuumModulePumpParams {
  // in % between 0 and 100
  percentPower: number
}

export interface VacuumModuleSetTargetPressureCreateCommand extends CommonCommandCreateInfo {
  commandType: 'vacuumModule/startSetVacuumPressure'
  params: VacuumModuleSetTargetPressureParams
}

export interface VacuumModuleSetTargetPowerCreateCommand extends CommonCommandCreateInfo {
  commandType: 'vacuumModule/startSetVacuumPower'
  params: VacuumModuleSetTargetPowerParams
}

export interface VacuumModuleStopPumpCreateCommand extends CommonCommandCreateInfo {
  commandType: 'vacuumModule/stopVacuum'
  params: ModuleOnlyParams
}

export interface VacuumModuleOpenVentCreateCommand extends CommonCommandCreateInfo {
  commandType: 'vacuumModule/openVent'
  params: ModuleOnlyParams
}

export interface VacuumModuleCloseVentCreateCommand extends CommonCommandCreateInfo {
  commandType: 'vacuumModule/closeVent'
  params: ModuleOnlyParams
}

export interface VacuumModuleStartRunProfileCreateCommand extends CommonCommandCreateInfo {
  commandType: 'vacuumModule/startRunProfile'
  params: VacuumRunProfileParams
}

export interface VacuumModuleSetTargetPressureRunTimeCommand
  extends CommonCommandRunTimeInfo, VacuumModuleSetTargetPressureCreateCommand {
  result?: any
}
export interface VacuumModuleSetTargetPowerRunTimeCommand
  extends CommonCommandRunTimeInfo, VacuumModuleSetTargetPowerCreateCommand {
  result?: any
}
export interface VacuumModuleStopPumpRunTimeCommand
  extends CommonCommandRunTimeInfo, VacuumModuleStopPumpCreateCommand {
  result?: any
}
export interface VacuumModuleOpenVentRunTimeCommand
  extends CommonCommandRunTimeInfo, VacuumModuleOpenVentCreateCommand {
  result?: any
}
export interface VacuumModuleCloseVentRunTimeCommand
  extends CommonCommandRunTimeInfo, VacuumModuleCloseVentCreateCommand {
  result?: any
}
export interface VacuumModuleStartRunProfileRunTimeCommand
  extends CommonCommandRunTimeInfo, VacuumModuleStartRunProfileCreateCommand {
  result?: any
}
