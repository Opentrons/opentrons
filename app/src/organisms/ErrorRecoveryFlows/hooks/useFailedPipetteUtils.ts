import { useRunCurrentState } from '@opentrons/react-api-client'

import { isPartialTipConfig } from '/app/local-resources/instruments'

import type {
  NozzleLayoutValues,
  Instruments,
  Run,
  PipetteData,
} from '@opentrons/api-client'
import type { ErrorRecoveryFlowsProps } from '/app/organisms/ErrorRecoveryFlows'

export interface UseFailedPipetteUtilsParams
  extends UseFailedCommandPipetteInfoProps {
  runId: string
}

export interface UseFailedPipetteUtilsResult {
  relevantActiveNozzleLayout: NozzleLayoutValues | null
  isPartialTipConfigValid: boolean
  failedPipetteInfo: ReturnType<typeof getFailedCommandPipetteInfo>
}

export function useFailedPipetteUtils(
  props: UseFailedPipetteUtilsParams
): UseFailedPipetteUtilsResult {
  const { failedCommandByRunRecord, runId } = props

  const failedPipetteId =
    failedCommandByRunRecord != null
      ? 'pipetteId' in failedCommandByRunRecord.params
        ? failedCommandByRunRecord.params.pipetteId
        : null
      : null

  const { data: runCurrentState } = useRunCurrentState(runId, {
    enabled: failedPipetteId != null,
  })

  const relevantActiveNozzleLayout =
    runCurrentState?.data.activeNozzleLayouts[failedPipetteId] ?? null

  const failedPipetteInfo = getFailedCommandPipetteInfo(props)

  const isPartialTipConfigValid =
    failedPipetteInfo != null && relevantActiveNozzleLayout != null
      ? isPartialTipConfig({
          channel: failedPipetteInfo.data.channels,
          activeNozzleCount:
            relevantActiveNozzleLayout.activeNozzles.length ?? 0,
        })
      : false

  return {
    relevantActiveNozzleLayout,
    isPartialTipConfigValid,
    failedPipetteInfo,
  }
}

interface UseFailedCommandPipetteInfoProps {
  runRecord: Run | undefined
  attachedInstruments: Instruments | undefined
  failedCommandByRunRecord: ErrorRecoveryFlowsProps['failedCommandByRunRecord']
}

// /instruments data for the pipette used in the failedCommand, if any.
export function getFailedCommandPipetteInfo({
  failedCommandByRunRecord,
  runRecord,
  attachedInstruments,
}: UseFailedCommandPipetteInfoProps): PipetteData | null {
  if (
    failedCommandByRunRecord == null ||
    !('pipetteId' in failedCommandByRunRecord.params)
  ) {
    return null
  } else {
    const failedPipetteId = failedCommandByRunRecord.params.pipetteId
    const runRecordPipette = runRecord?.data.pipettes.find(
      pipette => pipette.id === failedPipetteId
    )

    const failedInstrumentInfo = attachedInstruments?.data.find(
      instrument =>
        'mount' in instrument && instrument.mount === runRecordPipette?.mount
    ) as PipetteData

    return failedInstrumentInfo ?? null
  }
}
