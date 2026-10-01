import { useIsFlex } from '/app/redux-resources/robots'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useNotifyCamera } from '/app/resources/camera/useNotifyCamera'
import { useNotifyClientDataLPC } from '/app/resources/client_data'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

export interface ProtocolRunSetupLoadingState {
  /** Shared gate for all run-details tabs. */
  isRunOrAnalysisLoading: boolean
  /** Setup tab spinner until analysis + Flex LPC/camera substates settle. */
  isSetupLoading: boolean
  isRunRecordLoading: boolean
  isFlexLPCSettled: boolean
  isCameraLoading: boolean
}

/**
 * Loading gates for protocol run details.
 * - isRunOrAnalysisLoading: all tabs (run record / analysis)
 * - isSetupLoading: Setup tab only (also Flex LPC + camera)
 *
 * LPC "settled" means client LPC data has finished loading.
 */
export function useProtocolRunSetupLoadingState(
  runId: string,
  robotName: string,
  isFlexLPCInitializing: boolean,
  isRunRecordLoading: boolean
): ProtocolRunSetupLoadingState {
  const isFlex = useIsFlex(robotName)
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis

  const { isLoading: isCameraLoading } = useNotifyCamera({
    staleTime: Infinity,
    enabled: isFlex,
  })
  const { isLoading: isClientLPCLoading } = useNotifyClientDataLPC({
    enabled: isFlex,
  })

  const isFlexLPCSettled = !isFlexLPCInitializing && !isClientLPCLoading

  const isRunOrAnalysisLoading = isRunRecordLoading || protocolAnalysis == null

  const isSetupLoading =
    isRunOrAnalysisLoading ||
    (isFlex && !isFlexLPCSettled) ||
    (isFlex && isCameraLoading)

  return {
    isRunOrAnalysisLoading,
    isSetupLoading,
    isRunRecordLoading,
    isFlexLPCSettled,
    isCameraLoading: isFlex && isCameraLoading,
  }
}
