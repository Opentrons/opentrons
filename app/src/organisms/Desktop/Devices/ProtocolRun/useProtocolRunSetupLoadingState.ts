import { useSelector } from 'react-redux'

import { useIsFlex } from '/app/redux-resources/robots'
import { selectAreOffsetsApplied } from '/app/redux/protocol-runs'
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
 * Loading gate for the protocol-run Setup tab only.
 * Header skeleton stays separate (isRunRecordLoading).
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
  // is this an over kill?
  const flexOffsetsApplied = useSelector(selectAreOffsetsApplied(runId))

  const isFlexLPCSettled =
    !isFlexLPCInitializing && !isClientLPCLoading && flexOffsetsApplied

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
