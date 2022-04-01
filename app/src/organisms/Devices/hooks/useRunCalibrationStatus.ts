import { MATCH, INEXACT_MATCH } from '../../../redux/pipettes'
import { useDeckCalibrationStatus, useRunPipetteInfoByMount } from '.'

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

  if (deckCalStatus !== 'OK') {
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
      if (tiprack.lastModifiedDate == null) {
        calibrationStatus = {
          complete: false,
          reason: 'calibrate_tiprack_failure_reason',
        }
      }
    })
  })
  runPipetteInfoValues.forEach(pipette => {
    if (pipette !== null && pipette.pipetteCalDate == null) {
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
    if (pipette !== null && !pipetteIsMatch) {
      calibrationStatus = {
        complete: false,
        reason: 'attach_pipette_failure_reason',
      }
    }
  })
  return calibrationStatus
}
