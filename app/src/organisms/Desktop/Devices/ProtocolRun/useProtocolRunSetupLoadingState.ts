import { useSelector } from 'react-redux'

import { useIsFlex } from '/app/redux-resources/robots'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useNotifyCamera } from '/app/resources/camera/useNotifyCamera'
import { useNotifyClientDataLPC } from '/app/resources/client_data'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import type { State } from '/app/redux/types'

export interface ProtocolRunSetupLoadingState {
  /** Shared gate for all run-details tabs. */
  isRunOrAnalysisLoading: boolean
  /** Setup tab spinner until analysis + Flex LPC settled + camera. */
  isSetupLoading: boolean
  isRunRecordLoading: boolean
  isCameraLoading: boolean
}

/**
 * Loading gates for protocol run details.
 * - isRunOrAnalysisLoading: all tabs (run record / analysis)
 * - isSetupLoading: Setup tab only (Flex LPC store, client LPC, camera)
 *
 * Flex LPC settled = Redux LPC state exists for this run (hasLpcState).
 */
export function useProtocolRunSetupLoadingState(
  runId: string,
  robotName: string,
  isRunRecordLoading: boolean
): ProtocolRunSetupLoadingState {
  const isFlex = useIsFlex(robotName)
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis

  const hasLpcState = useSelector(
    (state: State) => state.protocolRuns?.[runId]?.lpc != null
  )

  const { data: cameraData, isLoading: isCameraQueryLoading } = useNotifyCamera(
    {
      staleTime: Infinity,
      enabled: isFlex,
    }
  )
  const { data: clientLPCData, isLoading: isClientLPCQueryLoading } =
    useNotifyClientDataLPC({
      enabled: isFlex,
    })

  // Prefer "no data yet" over isLoading
  const isCameraLoading = isFlex && cameraData == null && isCameraQueryLoading
  const isClientLPCLoading =
    isFlex && clientLPCData == null && isClientLPCQueryLoading

  const isRunOrAnalysisLoading = isRunRecordLoading || protocolAnalysis == null

  const isSetupLoading =
    isRunOrAnalysisLoading ||
    (isFlex && !hasLpcState) ||
    isClientLPCLoading ||
    isCameraLoading

  return {
    isRunOrAnalysisLoading,
    isSetupLoading,
    isRunRecordLoading,
    isCameraLoading,
  }
}
