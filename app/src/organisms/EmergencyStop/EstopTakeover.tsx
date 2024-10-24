import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useEstopQuery } from '@opentrons/react-api-client'

import { EstopPressedModal } from './EstopPressedModal'
import { EstopMissingModal } from './EstopMissingModal'
import { useIsUnboxingFlowOngoing } from '/app/redux-resources/config'
import { getLocalRobot } from '/app/redux/discovery'
import { PHYSICALLY_ENGAGED, NOT_PRESENT, DISENGAGED } from './constants'
import { EstopState } from '@opentrons/api-client'

const ESTOP_CURRENTLY_DISENGAGED_REFETCH_INTERVAL_MS = 10000
const ESTOP_CURRENTLY_ENGAGED_REFETCH_INTERVAL_MS = 1000

interface EstopTakeoverProps {
  robotName?: string
}

export function EstopTakeover({ robotName }: EstopTakeoverProps): JSX.Element {
  const [isDismissedModal, setIsDismissedModal] = useState<boolean>(false)
  const [
    isWaitingForResumeOperation,
    setIsWatingForResumeOperation,
  ] = useState<boolean>(false)

  const [estopState, setEstopState] = useState<EstopState>(DISENGAGED)
  const [showEmergencyStopModal, setShowEmergencyStopModal] = useState<boolean>(
    false
  )

  // TODO: (ba, 2024-10-24): Use notifications instead of polling
  useEstopQuery({
    refetchInterval: showEmergencyStopModal
      ? ESTOP_CURRENTLY_ENGAGED_REFETCH_INTERVAL_MS
      : ESTOP_CURRENTLY_DISENGAGED_REFETCH_INTERVAL_MS,
    onSuccess: response => {
      setEstopState(response?.data.status)
      setShowEmergencyStopModal(
        response.data.status !== DISENGAGED || isWaitingForResumeOperation
      )
    },
  })

  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()
  const closeModal = (): void => {
    setIsWatingForResumeOperation(false)
  }
  const localRobot = useSelector(getLocalRobot)
  const localRobotName = localRobot?.name ?? 'no name'

  const TargetEstopModal = (): JSX.Element | null => {
    return estopState === NOT_PRESENT ? (
      <EstopMissingModal
        robotName={robotName != null ? robotName : localRobotName}
        closeModal={closeModal}
        isDismissedModal={isDismissedModal}
        setIsDismissedModal={setIsDismissedModal}
      />
    ) : estopState !== DISENGAGED || isWaitingForResumeOperation ? (
      <EstopPressedModal
        isEngaged={estopState === PHYSICALLY_ENGAGED}
        closeModal={closeModal}
        isWaitingForResumeOperation={isWaitingForResumeOperation}
        setIsWaitingForResumeOperation={() => {
          setIsWatingForResumeOperation(true)
        }}
      />
    ) : null
  }

  return (
    <>
      {showEmergencyStopModal && !isUnboxingFlowOngoing ? (
        <TargetEstopModal />
      ) : null}
    </>
  )
}
