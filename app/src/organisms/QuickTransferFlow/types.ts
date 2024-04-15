import { ACTIONS } from './constants'
import type { PipetteData } from '@opentrons/api-client'
import type { LabwareDefinition1 } from '@opentrons/shared-data'

export interface QuickTransferSetupState {
  pipette?: PipetteData
  tipRack?: LabwareDefinition1
  source?: LabwareDefinition1
  sourceWells?: string[]
  destination?: LabwareDefinition1
  destinationWells?: string[]
  volume?: number
}

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
  pipette: PipetteData
}
interface SelectTipRackAction {
  type: typeof ACTIONS.SELECT_TIP_RACK
  tipRack: LabwareDefinition1
}
interface SetSourceLabwareAction {
  type: typeof ACTIONS.SET_SOURCE_LABWARE
  labware: LabwareDefinition1
}
interface SetSourceWellsAction {
  type: typeof ACTIONS.SET_SOURCE_WELLS
  wells: string[]
}
interface SetDestLabwareAction {
  type: typeof ACTIONS.SET_DEST_LABWARE
  labware: LabwareDefinition1
}
interface SetDestWellsAction {
  type: typeof ACTIONS.SET_DEST_WELLS
  wells: string[]
}
interface SetVolumeAction {
  type: typeof ACTIONS.SET_VOLUME
  volume: number
}
