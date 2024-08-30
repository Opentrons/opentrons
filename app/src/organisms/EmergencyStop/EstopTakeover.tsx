import * as React from 'react'
import { useSelector } from 'react-redux'
import { useEstopQuery, useHost } from '@opentrons/react-api-client'

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

const ESTOP_CURRENTLY_DISENGAGED_REFETCH_INTERVAL_MS = 10000
const ESTOP_CURRENTLY_ENGAGED_REFETCH_INTERVAL_MS = 1000

interface EstopTakeoverProps {
  robotName?: string
}

export function EstopTakeover({ robotName }: EstopTakeoverProps): JSX.Element {
  const [estopEngaged, setEstopEngaged] = React.useState<boolean>(false)
  const [
    isWaitingForLogicalDisengage,
    setIsWaitingForLogicalDisengage,
  ] = React.useState<boolean>(false)
  const { data: estopStatus } = useEstopQuery({
    refetchInterval: estopEngaged
      ? ESTOP_CURRENTLY_ENGAGED_REFETCH_INTERVAL_MS
      : ESTOP_CURRENTLY_DISENGAGED_REFETCH_INTERVAL_MS,
    onSuccess: response => {
      setEstopEngaged(
        [PHYSICALLY_ENGAGED || LOGICALLY_ENGAGED].includes(
          response?.data.status
        )
      )
      setIsWaitingForLogicalDisengage(false)
    },
  })
  console.log(`estop status: ${estopStatus?.data.status}`)
  const host = useHost()

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
            isWaitingForLogicalDisengage={isWaitingForLogicalDisengage}
            setShouldSeeLogicalDisengage={() => {
              setIsWaitingForLogicalDisengage(true)
            }}
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
