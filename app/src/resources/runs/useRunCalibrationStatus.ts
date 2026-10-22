import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { isGripperInCommands } from '/app/resources/protocols/utils'

import { useMostRecentCompletedAnalysis } from '.'

import type { GripperData, PipetteData } from '@opentrons/api-client'
import type { LoadedPipette } from '@opentrons/shared-data'
import type { ProtocolCalibrationStatus } from './types'

export function useRunCalibrationStatus(
  robotName: string,
  runId: string
): ProtocolCalibrationStatus {
  const robotAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedAnalysis = useStoredProtocolAnalysis(runId)
  const { data: instrumentsQueryData = null } = useInstrumentsQuery()

  const attachedInstruments = instrumentsQueryData?.data ?? []

  const requiredPipettes: LoadedPipette[] =
    robotAnalysis?.pipettes ?? storedAnalysis?.pipettes ?? []
  const wrongPipettesAttached = requiredPipettes.some(speccedPipette => {
    const pipetteOnThisMount = instrumentsQueryData?.data.find(
      (i): i is PipetteData =>
        i.instrumentType === 'pipette' &&
        i.ok &&
        i.mount === speccedPipette.mount
    )
    return pipetteOnThisMount?.instrumentName !== speccedPipette.pipetteName
  })
  if (wrongPipettesAttached) {
    return { complete: false, reason: 'attach_pipette_failure_reason' }
  }

  const pipettesNotCalibrated = requiredPipettes.some(speccedPipette => {
    const pipetteMatch = instrumentsQueryData?.data.find(
      (i): i is PipetteData =>
        i.instrumentType === 'pipette' &&
        i.ok &&
        i.mount === speccedPipette.mount &&
        i?.instrumentName === speccedPipette.pipetteName
    )
    return pipetteMatch?.data.calibratedOffset?.last_modified == null
  })
  if (pipettesNotCalibrated) {
    return { complete: false, reason: 'calibrate_pipette_failure_reason' }
  }

  const protocolRequiresGripper = isGripperInCommands(
    robotAnalysis?.commands ?? storedAnalysis?.commands ?? []
  )
  if (protocolRequiresGripper) {
    const attachedGripper = attachedInstruments.find(
      (i): i is GripperData => i.instrumentType === 'gripper' && i.ok
    )
    if (attachedGripper == null) {
      return { complete: false, reason: 'attach_gripper_failure_reason' }
    } else if (attachedGripper.data.calibratedOffset?.last_modified == null) {
      return { complete: false, reason: 'calibrate_gripper_failure_reason' }
    }
  }
  return { complete: true }
}
