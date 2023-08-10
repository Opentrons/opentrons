import * as React from 'react'
import { useSelector } from 'react-redux'
import { useEstopQuery } from '@opentrons/react-api-client'

import { EstopPressedModal } from './EstopPressedModal'
import { EstopMissingModal } from './EstopMissingModal'
import { useEstopContext } from './hooks'
import { useIsUnboxingFlowOngoing } from '../RobotSettingsDashboard/NetworkSettings/hooks'
import { getLocalRobot } from '../../redux/discovery'
import {
  PHYSICALLY_ENGAGED,
  LOGICALLY_ENGAGED,
  NOT_PRESENT,
  DISENGAGED,
} from './constants'

const ESTOP_REFETCH_INTERVAL_MS = 10000

interface EstopTakeoverProps {
  robotName?: string
}

export function EstopTakeover({ robotName }: EstopTakeoverProps): JSX.Element {
  const { data: estopStatus } = useEstopQuery({
    refetchInterval: ESTOP_REFETCH_INTERVAL_MS,
  })
  const {
    isEmergencyStopModalDismissed,
    setIsEmergencyStopModalDismissed,
  } = useEstopContext()
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()
  const closeModal = (): void => {
    if (estopStatus?.data.status === DISENGAGED) {
      setIsEmergencyStopModalDismissed(false)
    }
  }
  const localRobot = useSelector(getLocalRobot)
  const localRobotName = localRobot?.name ?? 'no name'

  const TargetEstopModal = (): JSX.Element | null => {
    switch (estopStatus?.data.status) {
      case PHYSICALLY_ENGAGED:
      case LOGICALLY_ENGAGED:
        return (
          <EstopPressedModal
            isEngaged={estopStatus?.data.status === PHYSICALLY_ENGAGED}
            closeModal={closeModal}
            isDismissedModal={isEmergencyStopModalDismissed}
            setIsDismissedModal={setIsEmergencyStopModalDismissed}
          />
        )
      case NOT_PRESENT:
        return (
          <EstopMissingModal
            robotName={robotName != null ? robotName : localRobotName}
            closeModal={closeModal}
            isDismissedModal={isEmergencyStopModalDismissed}
            setIsDismissedModal={setIsEmergencyStopModalDismissed}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {estopStatus?.data.status !== DISENGAGED && !isUnboxingFlowOngoing ? (
        <TargetEstopModal />
      ) : null}
    </>
  )
}
