import type { PipetteData, Instruments, Run } from '@opentrons/api-client'
import type { ErrorRecoveryFlowsProps } from '..'

interface UseFailedCommandPipetteInfoProps {
  failedCommand: ErrorRecoveryFlowsProps['failedCommand']
  runRecord?: Run
  attachedInstruments?: Instruments
}

// /instruments data for the pipette used in the failedCommand, if any.
export function getFailedCommandPipetteInfo({
  failedCommand,
  runRecord,
  attachedInstruments,
}: UseFailedCommandPipetteInfoProps): PipetteData | null {
  if (failedCommand == null || !('pipetteId' in failedCommand.params)) {
    return null
  } else {
    const failedPipetteId = failedCommand.params.pipetteId
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
