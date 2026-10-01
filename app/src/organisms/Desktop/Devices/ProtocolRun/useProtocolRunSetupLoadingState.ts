import { useIsFlex } from '/app/redux-resources/robots'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useNotifyCamera } from '/app/resources/camera/useNotifyCamera'
import { useNotifyClientDataLPC } from '/app/resources/client_data'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

export interface ProtocolRunSetupLoadingState {
  /** Setup tab spinner until analysis + Flex LPC/camera substates settle. */
  isSetupLoading: boolean
  isRunRecordLoading: boolean
  isFlexLPCSettled: boolean
  isCameraLoading: boolean
}

/**
 * Loading gate for the Setup tab (run record / analysis + Flex LPC + camera).
 *
 * LPC "settled" means client LPC data has finished loading
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

  const isSetupLoading =
    isRunRecordLoading ||
    protocolAnalysis == null ||
    (isFlex && !isFlexLPCSettled) ||
    (isFlex && isCameraLoading)

  return {
    isSetupLoading,
    isRunRecordLoading,
    isFlexLPCSettled,
    isCameraLoading: isFlex && isCameraLoading,
  }
}
