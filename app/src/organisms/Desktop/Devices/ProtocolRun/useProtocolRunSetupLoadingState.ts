import { useSelector } from 'react-redux'

import { useIsFlex } from '/app/redux-resources/robots'
import { selectAreOffsetsApplied } from '/app/redux/protocol-runs'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useNotifyCamera } from '/app/resources/camera/useNotifyCamera'
import { useNotifyClientDataLPC } from '/app/resources/client_data'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

export interface ProtocolRunSetupLoadingState {
  /** Shared gate for all run-details tabs. */
  isRunOrAnalysisLoading: boolean
  /** Setup tab spinner until analysis + Flex LPC finalized status + camera settle. */
  isSetupLoading: boolean
  isRunRecordLoading: boolean
  isCameraLoading: boolean
}

/**
 * Loading gates for protocol run details.
 * - isRunOrAnalysisLoading: all tabs (run record / analysis)
 * - isSetupLoading: Setup tab only (also Flex LPC finalized status + camera)
 *
 * Flex LPC "finalized" here means client LPC data has loaded and offsets for this run have been applied.
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
  const flexOffsetsApplied = useSelector(selectAreOffsetsApplied(runId))

  // Prefer "no data yet" over isLoading
  const isCameraLoading = isFlex && cameraData == null && isCameraQueryLoading
  const isClientLPCLoading =
    isFlex && clientLPCData == null && isClientLPCQueryLoading

  // Client LPC store is written with this runId when offsets are applied;
  // cleared to null otherwise. A match means another app already finalized.
  const clientSaysThisRunFinalized = clientLPCData?.data?.runId === runId

  // Finalized once client data is loaded; if another app already applied
  // offsets for this run, wait until Redux has caught up.
  const isFlexLPCFinalized =
    !isFlex ||
    (!isClientLPCLoading && (!clientSaysThisRunFinalized || flexOffsetsApplied))

  const isRunOrAnalysisLoading = isRunRecordLoading || protocolAnalysis == null

  const isSetupLoading =
    isRunOrAnalysisLoading || !isFlexLPCFinalized || isCameraLoading

  return {
    isRunOrAnalysisLoading,
    isSetupLoading,
    isRunRecordLoading,
    isCameraLoading,
  }
}
