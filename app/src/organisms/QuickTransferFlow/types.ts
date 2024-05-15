import type { Mount } from '@opentrons/api-client'
import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'
import type { ACTIONS, CONSOLIDATE, DISTRIBUTE, TRANSFER } from './constants'

export interface QuickTransferSetupState {
  pipette?: PipetteV2Specs
  mount?: Mount
  tipRack?: LabwareDefinition2
  source?: LabwareDefinition2
  sourceWells?: string[]
  destination?: LabwareDefinition2 | 'source'
  destinationWells?: string[]
  transferType?: TransferType
  volume?: number
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
