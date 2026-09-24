import type { Mount } from '@opentrons/api-client'
import type {
  CutoutConfig,
  LabwareDefinition2,
  PipetteV2Specs,
  PositionReference,
} from '@opentrons/shared-data'
import type {
  ACTIONS,
  ASPIRATE_SETTING_OPTIONS,
  CONSOLIDATE,
  DISPENSE_SETTING_OPTIONS,
  DISTRIBUTE,
  TRANSFER,
} from './constants'

export interface QuickTransferWizardState {
  pipette?: PipetteV2Specs
  mount?: Mount
  tipRack?: LabwareDefinition2
  source?: LabwareDefinition2
  sourceWells?: string[]
  destination?: LabwareDefinition2 | 'source'
  destinationWells?: string[]
  transferType?: TransferType
  volume?: number
  // Note added for liquid classes in Quick Transfer
  path?: PathOption
  changeTip?: ChangeTipOptions
  dropTipLocation?: CutoutConfig | string
  liquidClassName?: string
}
export type PathOption = 'single' | 'multiAspirate' | 'multiDispense'
export type ChangeTipOptions =
  'always' | 'once' | 'never' | 'perDest' | 'perSource'
export type FlowRateKind = 'aspirate' | 'dispense' | 'blowout'
export type BlowOutLocation = 'source_well' | 'dest_well' | CutoutConfig
export type AspirateSettingOption =
  (typeof ASPIRATE_SETTING_OPTIONS)[keyof typeof ASPIRATE_SETTING_OPTIONS]
export type DispenseSettingOption =
  (typeof DISPENSE_SETTING_OPTIONS)[keyof typeof DISPENSE_SETTING_OPTIONS]
export interface SettingItem {
  option: string
  copy: string
  value: string
  enabled: boolean
  onClick: () => void
}

export interface QuickTransferSummaryState {
  pipette: PipetteV2Specs
  mount: Mount
  tipRack: LabwareDefinition2
  source: LabwareDefinition2
  sourceWells: string[]
  destination: LabwareDefinition2 | 'source'
  destinationWells: string[]
  transferType: TransferType
  volume: number
  aspirateFlowRate: number
  dispenseFlowRate: number
  path: PathOption
  tipPositionAspirate: number
  preWetTip: boolean
  pushOutDispense?: {
    volume: number
  }
  mixOnAspirate?: {
    mixVolume: number
    repetitions: number
  }
  submergeAspirate?: {
    speed: number
    delayDuration: number
    position: number
    positionReference?: PositionReference
  }
  retractAspirate?: {
    speed: number
    delayDuration: number
    position: number
    positionReference?: PositionReference
  }
  delayAspirate?: {
    delayDuration: number
  }
  touchTipAspirate?: number // specifies the tip position from the top of the well
  touchTipAspirateSpeed?: number
  airGapAspirate?: number
  tipPositionDispense: number
  mixOnDispense?: {
    mixVolume: number
    repetitions: number
  }
  submergeDispense?: {
    speed: number
    delayDuration: number
    position: number
    positionReference?: PositionReference
  }
  retractDispense?: {
    speed: number
    delayDuration: number
    position: number
    positionReference?: PositionReference
  }
  delayDispense?: {
    delayDuration: number
  }
  touchTipDispense?: number // specifies the tip position from the top of the well
  touchTipDispenseSpeed?: number
  blowOutDispense?: {
    location?: BlowOutLocation
    flowRate?: number
  }
  airGapDispense?: number
  changeTip: ChangeTipOptions
  dropTipLocation: CutoutConfig | string
  liquidClassName: string
  conditionAspirate?: number
  disposalVolumeDispenseSettings?: {
    volume: number
    blowOutLocation: BlowOutLocation
    flowRate: number
  }
  // Note this is used to apply liquid class values to the state only once
  liquidClassValuesInitialized: boolean
}

export type TransferType =
  typeof CONSOLIDATE | typeof DISTRIBUTE | typeof TRANSFER

export type QuickTransferWizardAction =
  | SelectPipetteAction
  | SelectTipRackAction
  | SetSourceLabwareAction
  | SetSourceWellsAction
  | SetDestLabwareAction
  | SetDestWellsAction
  | SetVolumeAction
  | SetPipettePath
  | SetChangeTip
  | SetDropTipLocation
  | SetLiquidClassAction

export type QuickTransferSummaryAction =
  | SetAspirateFlowRateAction
  | SetDispenseFlowRateAction
  | SetPipettePath
  | SetAspirateTipPosition
  | SetPreWetTip
  | SetMixOnAspirate
  | SetDelayAspirate
  | SetTouchTipAspirate
  | SetAirGapAspirate
  | SetSubmergeAspirate
  | SetRetractAspirate
  | SetDispenseTipPosition
  | SetMixOnDispense
  | SetDelayDispense
  | SetTouchTipDispense
  | SetBlowOut
  | SetAirGapDispense
  | SetSubmergeDispense
  | SetRetractDispense
  | SetChangeTip
  | SetDropTipLocation
  | SetPushOut
  | SetConditionAspirate
  | SetDisposalVolumeDispense
  | SetLiquidClassValues

interface SetAspirateFlowRateAction {
  type: typeof ACTIONS.SET_ASPIRATE_FLOW_RATE
  rate: number
}
interface SetDispenseFlowRateAction {
  type: typeof ACTIONS.SET_DISPENSE_FLOW_RATE
  rate: number
}
interface SetPipettePath {
  type: typeof ACTIONS.SET_PIPETTE_PATH
  path: PathOption
}
interface SetAspirateTipPosition {
  type: typeof ACTIONS.SET_ASPIRATE_TIP_POSITION
  position: number
}
interface SetPreWetTip {
  type: typeof ACTIONS.SET_PRE_WET_TIP
  preWetTip: boolean
}
interface SetMixOnAspirate {
  type: typeof ACTIONS.SET_MIX_ON_ASPIRATE
  mixSettings?: { mixVolume: number; repetitions: number }
}
interface SetDelayAspirate {
  type: typeof ACTIONS.SET_DELAY_ASPIRATE
  delaySettings?: {
    delayDuration: number
  }
}
interface SetTouchTipAspirate {
  type: typeof ACTIONS.SET_TOUCH_TIP_ASPIRATE
  position?: number
  touchTipAspirateSpeed?: number
}
interface SetAirGapAspirate {
  type: typeof ACTIONS.SET_AIR_GAP_ASPIRATE
  volume?: number
}
interface SetSubmergeAspirate {
  type: typeof ACTIONS.SET_SUBMERGE_ASPIRATE
  submergeSettings?: {
    speed: number
    delayDuration: number
    position: number
    positionReference?: PositionReference
  }
}
interface SetRetractAspirate {
  type: typeof ACTIONS.SET_RETRACT_ASPIRATE
  retractSettings?: {
    speed: number
    delayDuration: number
    position: number
    positionReference?: PositionReference
  }
}
interface SetDispenseTipPosition {
  type: typeof ACTIONS.SET_DISPENSE_TIP_POSITION
  position: number
}
interface SetMixOnDispense {
  type: typeof ACTIONS.SET_MIX_ON_DISPENSE
  mixSettings?: { mixVolume: number; repetitions: number }
}
interface SetDelayDispense {
  type: typeof ACTIONS.SET_DELAY_DISPENSE
  delaySettings?: {
    delayDuration: number
  }
}
interface SetTouchTipDispense {
  type: typeof ACTIONS.SET_TOUCH_TIP_DISPENSE
  position?: number
  touchTipDispenseSpeed?: number
}
interface SetBlowOut {
  type: typeof ACTIONS.SET_BLOW_OUT
  blowOutSettings?: {
    location?: BlowOutLocation
    flowRate?: number
  }
}
interface SetAirGapDispense {
  type: typeof ACTIONS.SET_AIR_GAP_DISPENSE
  volume?: number
}
interface SetSubmergeDispense {
  type: typeof ACTIONS.SET_SUBMERGE_DISPENSE
  submergeSettings?: {
    speed: number
    delayDuration: number
    position: number
    positionReference?: PositionReference
  }
}
interface SetRetractDispense {
  type: typeof ACTIONS.SET_RETRACT_DISPENSE
  retractSettings?: {
    speed: number
    delayDuration: number
    position: number
    positionReference?: PositionReference
  }
}
interface SetChangeTip {
  type: typeof ACTIONS.SET_CHANGE_TIP
  changeTip: ChangeTipOptions
}
interface SetDropTipLocation {
  type: typeof ACTIONS.SET_DROP_TIP_LOCATION
  location: CutoutConfig | string
}

interface SetLiquidClassAction {
  type: typeof ACTIONS.SET_LIQUID_CLASS
  liquidClassName: string
}

interface SelectPipetteAction {
  type: typeof ACTIONS.SELECT_PIPETTE
  mount: Mount
  pipette: PipetteV2Specs
}
interface SelectTipRackAction {
  type: typeof ACTIONS.SELECT_TIP_RACK
  tipRack: LabwareDefinition2
}
interface SetSourceLabwareAction {
  type: typeof ACTIONS.SET_SOURCE_LABWARE
  labware: LabwareDefinition2
}
interface SetSourceWellsAction {
  type: typeof ACTIONS.SET_SOURCE_WELLS
  wells: string[]
}
interface SetDestLabwareAction {
  type: typeof ACTIONS.SET_DEST_LABWARE
  labware: LabwareDefinition2 | 'source'
}
interface SetDestWellsAction {
  type: typeof ACTIONS.SET_DEST_WELLS
  wells: string[]
}
interface SetVolumeAction {
  type: typeof ACTIONS.SET_VOLUME
  volume: number
}

interface SetPushOut {
  type: typeof ACTIONS.SET_PUSH_OUT
  pushOutSettings?: {
    volume: number
  }
}

interface SetConditionAspirate {
  type: typeof ACTIONS.SET_CONDITION_ASPIRATE
  conditionAspirate: number
}

interface SetDisposalVolumeDispense {
  type: typeof ACTIONS.SET_DISPOSAL_VOLUME_DISPENSE
  disposalVolumeDispenseSettings?: {
    volume: number
    blowOutLocation: BlowOutLocation
    flowRate: number
  }
}
interface SetLiquidClassValues {
  type: typeof ACTIONS.SET_LIQUID_CLASS_VALUES
  liquidClassValues: QuickTransferSummaryState
}
