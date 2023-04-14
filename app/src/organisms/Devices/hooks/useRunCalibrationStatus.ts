import { MATCH, INEXACT_MATCH } from '../../../redux/pipettes'
import { useDeckCalibrationStatus, useIsOT3, useRunPipetteInfoByMount } from '.'

export interface ProtocolCalibrationStatus {
  complete: boolean
  reason?:
    | 'calibrate_deck_failure_reason'
    | 'calibrate_tiprack_failure_reason'
    | 'calibrate_pipette_failure_reason'
    | 'attach_pipette_failure_reason'
}

export function useRunCalibrationStatus(
  robotName: string,
  runId: string
): ProtocolCalibrationStatus {
  const deckCalStatus = useDeckCalibrationStatus(robotName)
  const runPipetteInfoByMount = useRunPipetteInfoByMount(robotName, runId)
  const runPipetteInfoValues = Object.values(runPipetteInfoByMount)
  const isOT3 = useIsOT3(robotName)

  if (deckCalStatus !== 'OK' && !isOT3) {
    return {
      complete: false,
      reason: 'calibrate_deck_failure_reason',
    }
  }
  let calibrationStatus: ProtocolCalibrationStatus = {
    complete: true,
  }
  runPipetteInfoValues.forEach(pipette => {
    pipette?.tipRacksForPipette.forEach(tiprack => {
      if (tiprack.lastModifiedDate == null && !isOT3) {
        calibrationStatus = {
          complete: false,
          reason: 'calibrate_tiprack_failure_reason',
        }
      }
    })
  })
  runPipetteInfoValues.forEach(pipette => {
    // TODO(bh, 8/18/2022): remove isOT3 condition after OT-3 pipette calibration is implemented
    if (pipette !== null && pipette.pipetteCalDate == null && !isOT3) {
      calibrationStatus = {
        complete: false,
        reason: 'calibrate_pipette_failure_reason',
      }
    }
  })
  runPipetteInfoValues.forEach(pipette => {
    const pipetteIsMatch =
      pipette?.requestedPipetteMatch === MATCH ||
      pipette?.requestedPipetteMatch === INEXACT_MATCH
    // TODO(bh, 8/18/2022): remove isOT3 condition after OT-3 pipette calibration is implemented
    if (pipette !== null && !pipetteIsMatch && !isOT3) {
      calibrationStatus = {
        complete: false,
        reason: 'attach_pipette_failure_reason',
      }
    }
  })
  return calibrationStatus
}
