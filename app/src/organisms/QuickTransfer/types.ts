import type { PipetteData } from '@opentrons/api-client'
import type { LabwareDefinition1 } from '@opentrons/shared-data'
import { ACTIONS } from './constants'

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
  | SourceLabwareAction
  | SourceWellsAction
  | DestLabwareAction
  | DestWellsAction
  | VolumeAction

interface SelectPipetteAction {
  type: typeof ACTIONS.SELECT_PIPETTE
  pipette: PipetteData
}
interface SelectTipRackAction {
  type: typeof ACTIONS.SELECT_TIP_RACK
  tipRack: LabwareDefinition1
}
interface SourceLabwareAction {
  type: typeof ACTIONS.SOURCE_LABWARE
  labware: LabwareDefinition1
}
interface SourceWellsAction {
  type: typeof ACTIONS.SOURCE_WELLS
  wells: string[]
}
interface DestLabwareAction {
  type: typeof ACTIONS.DEST_LABWARE
  labware: LabwareDefinition1
}
interface DestWellsAction {
  type: typeof ACTIONS.DEST_WELLS
  wells: string[]
}
interface VolumeAction {
  type: typeof ACTIONS.VOLUME
  volume: number
}
