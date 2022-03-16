import { useSelector } from 'react-redux'
import { useCurrentRunPipetteInfoByMount } from './useCurrentRunPipetteInfoByMount'
import { getConnectedRobotName } from '../../../../redux/robot/selectors'
import { getDeckCalibrationStatus } from '../../../../redux/calibration/selectors'
import { MATCH, INEXACT_MATCH } from '../../../../redux/pipettes'

import type { State } from '../../../../redux/types'

export interface ProtocolCalibrationStatus {
  complete: boolean
  reason?:
    | 'calibrate_deck_failure_reason'
    | 'calibrate_tiprack_failure_reason'
    | 'calibrate_pipette_failure_reason'
    | 'attach_pipette_failure_reason'
}

export function useProtocolCalibrationStatus(): ProtocolCalibrationStatus {
  const robotName =
    useSelector((state: State) => getConnectedRobotName(state)) ?? ''
  const deckCalStatus = useSelector((state: State) =>
    getDeckCalibrationStatus(state, robotName)
  )
  const currentRunPipetteInfoByMount = useCurrentRunPipetteInfoByMount()
  const currentRunPipetteInfoValues = Object.values(
    currentRunPipetteInfoByMount
  )

  if (deckCalStatus !== 'OK') {
    return {
      complete: false,
      reason: 'calibrate_deck_failure_reason',
    }
  }
  let calibrationStatus: ProtocolCalibrationStatus = {
    complete: true,
  }
  currentRunPipetteInfoValues.forEach(pipette => {
    pipette?.tipRacksForPipette.forEach(tiprack => {
      if (tiprack.lastModifiedDate == null) {
        calibrationStatus = {
          complete: false,
          reason: 'calibrate_tiprack_failure_reason',
        }
      }
    })
  })
  currentRunPipetteInfoValues.forEach(pipette => {
    if (pipette !== null && pipette.pipetteCalDate == null) {
      calibrationStatus = {
        complete: false,
        reason: 'calibrate_pipette_failure_reason',
      }
    }
  })
  currentRunPipetteInfoValues.forEach(pipette => {
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
