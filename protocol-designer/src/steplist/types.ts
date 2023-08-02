import { THERMOCYCLER_PROFILE, THERMOCYCLER_STATE } from '../constants'
import {
  CommandCreatorArgs,
  MoveLabwareArgs,
  PauseArgs,
  ThermocyclerProfileStepArgs,
} from '@opentrons/step-generation'
import { ModuleType } from '@opentrons/shared-data'
import { StepIdType } from '../form-types'
import { FormError } from './formLevel/errors'
// timeline start and end
export const START_TERMINAL_ITEM_ID: '__initial_setup__' = '__initial_setup__'
export const END_TERMINAL_ITEM_ID: '__end__' = '__end__'
export const PRESAVED_STEP_ID: '__presaved_step__' = '__presaved_step__'
export type TerminalItemId =
  | typeof START_TERMINAL_ITEM_ID
  | typeof END_TERMINAL_ITEM_ID
  | typeof PRESAVED_STEP_ID
export type WellIngredientNames = Record<string, string>
// TODO: IL 2019-11-26 untangle single vs multi-channel data types for substeps.
// We tried to unify them with Maybes and Unions, but really they should be
// treated as 2 distinct paths
export type WellIngredientVolumeData =
  | {
      // single-channel format
      [ingredId: string]: { volume: number } | undefined
    }
  | {
      // multi-channel 'by well' format
      [well: string]: { [ingredId: string]: { volume: number } } | undefined
    }

export interface TipLocation {
  labwareId: string
  wellName: string
}
export type SubstepIdentifier = {
  stepId: StepIdType
  substepIndex: number
} | null
export interface NamedIngred {
  id: string
  name: string
}
export interface SourceDestData {
  wells: string[]
  preIngreds: WellIngredientVolumeData
  postIngreds: WellIngredientVolumeData
}
export interface SubstepTimelineFrame {
  substepIndex?: number
  activeTips: TipLocation | null | undefined
  source?: SourceDestData
  dest?: SourceDestData
  volume?: number | null
  channelId?: number
}
export interface SubstepWellData {
  well: string
  preIngreds: WellIngredientVolumeData
  postIngreds: WellIngredientVolumeData
}
export interface StepItemSourceDestRow {
  activeTips: TipLocation | null | undefined
  substepIndex?: number
  source?: SubstepWellData
  dest?: SubstepWellData
  volume?: number | null
  channelId?: number
}
// NOTE: delay is NOT a source-dest-style command creator, this type exists
// mostly to tell flow that :/
type SourceDestCommandCreatorName =
  | 'transfer'
  | 'distribute'
  | 'consolidate'
  | 'mix'
export interface SourceDestSubstepItemSingleChannel {
  substepType: 'sourceDest'
  multichannel: false
  commandCreatorFnName: SourceDestCommandCreatorName
  parentStepId: StepIdType
  rows: StepItemSourceDestRow[]
}
export interface SourceDestSubstepItemMultiChannel {
  substepType: 'sourceDest'
  multichannel: true
  commandCreatorFnName: SourceDestCommandCreatorName
  parentStepId: StepIdType
  volume?: number | null
  // uniform volume for all steps
  multiRows: StepItemSourceDestRow[][] // Array of arrays.
  // NOTE: "Row" means a tabular row on the steplist, NOT a "row" of wells on the deck
}
export type SourceDestSubstepItem =
  | SourceDestSubstepItemSingleChannel
  | SourceDestSubstepItemMultiChannel
export interface MagnetSubstepItem {
  substepType: 'magnet'
  engage: boolean
  labwareNickname: string | null | undefined
  message?: string
}
export interface TemperatureSubstepItem {
  substepType: 'temperature'
  temperature: number | null
  labwareNickname: string | null | undefined
  message?: string
}
export interface PauseSubstepItem {
  substepType: 'pause'
  pauseStepArgs: PauseArgs // Pause substeps use same data as processed form
}
export interface MoveLabwareSubstepItem {
  substepType: 'moveLabware'
  moveLabwareArgs: MoveLabwareArgs // Move labware substeps use same data as processed form
}
export interface WaitForTemperatureSubstepItem {
  substepType: 'waitForTemperature'
  temperature: number
  labwareNickname: string | null | undefined
  moduleType: ModuleType
  message?: string
}

export interface HeaterShakerSubstepItem {
  substepType: 'heaterShaker'
  labwareNickname: string | null | undefined
  targetHeaterShakerTemperature: number | null
  targetSpeed: number | null
  latchOpen: boolean
  heaterShakerTimerMinutes: number | null
  heaterShakerTimerSeconds: number | null
}

export interface ThermocyclerProfileSubstepItem {
  substepType: typeof THERMOCYCLER_PROFILE
  blockTargetTempHold: number | null
  labwareNickname: string | null | undefined
  lidOpenHold: boolean
  lidTargetTempHold: number | null
  message?: string
  meta: ThermocyclerProfileStepArgs['meta']
  profileSteps: ThermocyclerProfileStepArgs['profileSteps']
  profileTargetLidTemp: number | null
  profileVolume: number
}
export interface ThermocyclerStateSubstepItem {
  substepType: typeof THERMOCYCLER_STATE
  labwareNickname: string | null | undefined
  blockTargetTemp: number | null
  lidTargetTemp: number | null
  lidOpen: boolean
  message?: string
}
export type SubstepItemData =
  | SourceDestSubstepItem
  | PauseSubstepItem
  | MagnetSubstepItem
  | TemperatureSubstepItem
  | WaitForTemperatureSubstepItem
  | ThermocyclerProfileSubstepItem
  | ThermocyclerStateSubstepItem
  | HeaterShakerSubstepItem
  | MoveLabwareSubstepItem
export type Substeps = Record<StepIdType, SubstepItemData | null | undefined>
export type StepFormErrors = FormError[]
export interface StepArgsAndErrors {
  errors: boolean
  stepArgs: CommandCreatorArgs | null // TODO: incompleteData field when this is null?
}
export type StepArgsAndErrorsById = Record<string, StepArgsAndErrors>
export type LabwareNamesByModuleId = Record<
  string,
  | {
      nickname: string
    }
  | null
  | undefined
>
