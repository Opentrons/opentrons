import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sortRunRecordOffsets } from '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/useInitLPCStore/sortRunRecordOffsets'
import { getActivePipetteId } from '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/utils'
import {
  LPC_STEPS,
  OFFSETS_SOURCE_INITIALIZING,
  updateLPC,
} from '/app/redux/protocol-runs'

import type { Run, StoredLabwareOffset } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  DeckConfiguration,
  LabwareDefinition,
} from '@opentrons/shared-data'
import type { LPCLabwareInfo, LPCWizardState } from '/app/redux/protocol-runs'
import type { State } from '/app/redux/types'

export interface UseLPCInitialStateProps {
  runId: string | null
  runRecord: Run | undefined
  analysis: CompletedProtocolAnalysis | null
  protocolName: string | undefined
  maintenanceRunId: string | null
  labwareDefs: LabwareDefinition[]
  labwareInfo: LPCLabwareInfo
  deckConfig: DeckConfiguration | undefined
  isFlex: boolean
  flexStoredOffsets: StoredLabwareOffset[] | undefined
}

// Initialize the LPC store if underlying store data is sufficiently present.
export function useInitLPCStore({
  analysis,
  runId,
  labwareDefs,
  protocolName,
  runRecord,
  deckConfig,
  isFlex,
  flexStoredOffsets,
  ...rest
}: UseLPCInitialStateProps): void {
  const dispatch = useDispatch()
  const lpcState = useSelector(
    (state: State) => state?.protocolRuns[runId ?? '']?.lpc
  )
  const runRecordOffsets = runRecord?.data.labwareOffsets

  const isReadyToInit =
    lpcState == null &&
    runId != null &&
    analysis != null &&
    protocolName != null &&
    deckConfig != null &&
    flexStoredOffsets !== undefined &&
    runRecordOffsets !== undefined

  // Initialize the store. This effect should only occur once.
  useEffect(() => {
    if (isReadyToInit && isFlex) {
      const activePipetteId = getActivePipetteId(analysis.pipettes)

      const initialState: LPCWizardState = {
        ...rest,
        protocolData: analysis,
        labwareDefs,
        activePipetteId: activePipetteId ?? 'NO_PIPETTE',
        protocolName,
        deckConfig,
        labwareInfo: {
          ...rest.labwareInfo,
          sourcedOffsets: OFFSETS_SOURCE_INITIALIZING,
          initialRunRecordOffsets: sortRunRecordOffsets(runRecordOffsets),
          initialDatabaseOffsets: flexStoredOffsets,
        },
        steps: {
          currentStepIndex: 0,
          totalStepCount: LPC_STEPS.length,
          all: LPC_STEPS,
          lastStepIndices: null,
          currentSubstep: null,
        },
        ui: {
          showDefaultOffsetInfoBanner: true,
          showSnackbar: null,
        },
      }

      dispatch(updateLPC(runId, initialState))
    }
  }, [isReadyToInit])
}
