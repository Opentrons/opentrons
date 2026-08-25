import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { useEstopQuery } from '@opentrons/react-api-client'

import { useIsUnboxingFlowOngoing } from '/app/redux-resources/config'
import { getLocalRobot } from '/app/redux/discovery'

import { DISENGAGED, NOT_PRESENT, PHYSICALLY_ENGAGED } from './constants'
import { EstopMissingModal } from './EstopMissingModal'
import { EstopPressedModal } from './EstopPressedModal'

import type { ReactNode } from 'react'
import type { EstopState } from '@opentrons/api-client'

const ESTOP_CURRENTLY_DISENGAGED_REFETCH_INTERVAL_MS = 10000
const ESTOP_CURRENTLY_ENGAGED_REFETCH_INTERVAL_MS = 1000

interface EstopTakeoverProps {
  robotName?: string
}

export function EstopTakeover({ robotName }: EstopTakeoverProps): ReactNode {
  const [isDismissedModal, setIsDismissedModal] = useState<boolean>(false)
  const [isWaitingForResumeOperation, setIsWatingForResumeOperation] =
    useState<boolean>(false)

  const [estopState, setEstopState] = useState<EstopState>()
  const [showEmergencyStopModal, setShowEmergencyStopModal] =
    useState<boolean>(false)

  // TODO: (ba, 2024-10-24): Use notifications instead of polling
  const { data: estopStatus } = useEstopQuery({
    refetchInterval: showEmergencyStopModal
      ? ESTOP_CURRENTLY_ENGAGED_REFETCH_INTERVAL_MS
      : ESTOP_CURRENTLY_DISENGAGED_REFETCH_INTERVAL_MS,
  })
  useEffect(
    () => {
      if (estopStatus) {
        setEstopState(estopStatus.data.status)
        setShowEmergencyStopModal(
          estopStatus.data.status !== DISENGAGED || isWaitingForResumeOperation
        )
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estopStatus]
  )

  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()
  const closeModal = (): void => {
    setIsWatingForResumeOperation(false)
  }
  const localRobot = useSelector(getLocalRobot)
  const localRobotName = localRobot?.name ?? 'no name'

  const targetEstopModal =
    estopState === NOT_PRESENT ? (
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

  return (
    <>
      {showEmergencyStopModal && !isUnboxingFlowOngoing
        ? targetEstopModal
        : null}
    </>
  )
}
