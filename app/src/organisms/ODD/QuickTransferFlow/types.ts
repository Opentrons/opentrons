import type { Mount } from '@opentrons/api-client'
import type {
  CutoutConfig,
  LabwareDefinition2,
  LiquidClass,
  PipetteV2Specs,
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
  dropTipLocation?: CutoutConfig
  liquidClass?: LiquidClass
}
export type PathOption = 'single' | 'multiAspirate' | 'multiDispense'
export type ChangeTipOptions =
  | 'always'
  | 'once'
  | 'never'
  | 'perDest'
  | 'perSource'
export type FlowRateKind = 'aspirate' | 'dispense' | 'blowout'
export type BlowOutLocation = 'source_well' | 'dest_well' | CutoutConfig
export type AspirateSettingOption = typeof ASPIRATE_SETTING_OPTIONS[keyof typeof ASPIRATE_SETTING_OPTIONS]
export type DispenseSettingOption = typeof DISPENSE_SETTING_OPTIONS[keyof typeof DISPENSE_SETTING_OPTIONS]
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
  pushOut: boolean
  mixOnAspirate?: {
    mixVolume: number
    repetitions: number
  }
  submergeAspirate?: {
    speed: number
    positionFromBottom: number
  }
  retractAspirate?: {
    speed: number
    positionFromBottom: number
  }
  delayAspirate?: {
    delayDuration: number
  }
  touchTipAspirate?: number
  touchTipAspirateSpeed?: number
  airGapAspirate?: number
  tipPositionDispense: number
  mixOnDispense?: {
    mixVolume: number
    repetitions: number
  }
  submergeDispense?: {
    speed: number
    positionFromBottom: number
  }
  retractDispense?: {
    speed: number
    positionFromBottom: number
  }
  delayDispense?: {
    delayDuration: number
  }
  touchTipDispense?: number
  touchTipDispenseSpeed?: number
  disposalVolume?: number
  blowOut?: BlowOutLocation
  airGapDispense?: number
  changeTip: ChangeTipOptions
  dropTipLocation: CutoutConfig
  liquidClass: LiquidClass
  conditionAspirate?: number
  disposalVolumeDispenseSettings?: {
    volume: number
    blowOutLocation: BlowOutLocation
    flowRate: number
  }
}

export type TransferType =
  | typeof CONSOLIDATE
  | typeof DISTRIBUTE
  | typeof TRANSFER

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
  disposalVolume?: number
  blowOutLocation?: BlowOutLocation
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
    positionFromBottom: number
  }
}
interface SetRetractAspirate {
  type: typeof ACTIONS.SET_RETRACT_ASPIRATE
  retractSettings?: {
    speed: number
    positionFromBottom: number
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
  location?: BlowOutLocation
}
interface SetAirGapDispense {
  type: typeof ACTIONS.SET_AIR_GAP_DISPENSE
  volume?: number
}
interface SetSubmergeDispense {
  type: typeof ACTIONS.SET_SUBMERGE_DISPENSE
  submergeSettings?: {
    speed: number
    positionFromBottom: number
  }
}
interface SetRetractDispense {
  type: typeof ACTIONS.SET_RETRACT_DISPENSE
  retractSettings?: {
    speed: number
    positionFromBottom: number
  }
}
interface SetChangeTip {
  type: typeof ACTIONS.SET_CHANGE_TIP
  changeTip: ChangeTipOptions
}
interface SetDropTipLocation {
  type: typeof ACTIONS.SET_DROP_TIP_LOCATION
  location: CutoutConfig
}

interface SetLiquidClassAction {
  type: typeof ACTIONS.SET_LIQUID_CLASS
  liquidClass: LiquidClass
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
  pushOut: boolean
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
