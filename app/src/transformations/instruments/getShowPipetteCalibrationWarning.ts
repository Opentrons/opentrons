import { INCONSISTENT_PIPETTE_OFFSET } from '@opentrons/api-client'
import type { Instruments, PipetteData } from '@opentrons/api-client'

export function getShowPipetteCalibrationWarning(
  attachedInstruments?: Instruments
): boolean {
  return (
    attachedInstruments?.data.some((i): i is PipetteData => {
      const failuresList =
        i.ok && i.data.calibratedOffset?.reasonability_check_failures != null
          ? i.data.calibratedOffset?.reasonability_check_failures
          : []
      if (failuresList.length > 0) {
        return failuresList[0]?.kind === INCONSISTENT_PIPETTE_OFFSET
      } else return false
    }) ?? false
  )
}
