import type {
  CompletedProtocolAnalysis,
  DeckConfiguration,
  LabwareDefinition,
} from '@opentrons/shared-data'
import type {
  HANDLE_LW_SUBSTEP,
  LPC_STEP,
} from '/app/redux/protocol-runs/constants'
import type { LPCLabwareInfo } from './labware'
import type { LPCUiState } from './ui'

export interface LPCWizardState {
  steps: StepInfo
  activePipetteId: string
  labwareInfo: LPCLabwareInfo
  protocolData: CompletedProtocolAnalysis
  labwareDefs: LabwareDefinition[]
  deckConfig: DeckConfiguration
  protocolName: string
  maintenanceRunId: string | null
  ui: LPCUiState
}

export interface StepInfo {
  currentStepIndex: number
  totalStepCount: number
  all: LPCStep[]
  /* The last step idx in the user's routing history - not necessarily the previous step idx. */
  lastStepIndices: number[] | null
  /* Certain steps utilize substeps. These substeps shouldn't impact state the same way as steps,
   * so they are treated differently. */
  currentSubstep: HandleLwSubstepType | null
}

export type LPCStep = keyof typeof LPC_STEP

export type LPCFlowType = 'default' | 'location-specific'

export type LPCSubstep = HandleLwSubstepType

export type HandleLwSubstepType = typeof HANDLE_LW_SUBSTEP[keyof typeof HANDLE_LW_SUBSTEP]
