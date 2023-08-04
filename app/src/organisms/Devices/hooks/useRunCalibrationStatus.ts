import { MATCH, INEXACT_MATCH } from '../../../redux/pipettes'
import {
  useDeckCalibrationStatus,
  useIsOT3,
  useRunPipetteInfoByMount,
  useStoredProtocolAnalysis,
} from '.'
import { DeckCalibrationStatus } from '../../../redux/calibration/api-types'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import {
  CompletedProtocolAnalysis,
  LoadedPipette,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import { isGripperInCommands } from '../../../resources/protocols/utils'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { GripperData, Instruments, PipetteData } from '@opentrons/api-client'

export interface ProtocolCalibrationStatus {
  complete: boolean
  reason?:
    | 'calibrate_deck_failure_reason'
    | 'calibrate_tiprack_failure_reason'
    | 'calibrate_pipette_failure_reason'
    | 'calibrate_gripper_failure_reason'
    | 'attach_pipette_failure_reason'
    | 'attach_gripper_failure_reason'
}

export function useRunCalibrationStatus(
  robotName: string,
  runId: string
): ProtocolCalibrationStatus {
  const deckCalStatus = useDeckCalibrationStatus(robotName)
  const runPipetteInfoByMount = useRunPipetteInfoByMount(runId)
  const isOT3 = useIsOT3(robotName)
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const { data: instrumentsQueryData = null } = useInstrumentsQuery()

  return isOT3
    ? getFlexRunCalibrationStatus(
        mostRecentAnalysis,
        storedProtocolAnalysis,
        instrumentsQueryData
      )
    : getOT2RunCalibrationStatus(deckCalStatus, runPipetteInfoByMount)
}

function getFlexRunCalibrationStatus(
  robotAnalysis: CompletedProtocolAnalysis | null,
  storedAnalysis: ProtocolAnalysisOutput | null,
  instrumentsQueryData: Instruments | null
): ProtocolCalibrationStatus {
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
  if (wrongPipettesAttached)
    return { complete: false, reason: 'attach_pipette_failure_reason' }

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
  if (pipettesNotCalibrated)
    return { complete: false, reason: 'calibrate_pipette_failure_reason' }

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

function getOT2RunCalibrationStatus(
  deckCalStatus: DeckCalibrationStatus | null,
  runPipetteInfoByMount: ReturnType<typeof useRunPipetteInfoByMount>
): ProtocolCalibrationStatus {
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
