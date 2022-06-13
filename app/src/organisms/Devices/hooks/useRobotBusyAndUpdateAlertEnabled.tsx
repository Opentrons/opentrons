import { useAllSessionsQuery } from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'
import {
  ALERT_APP_UPDATE_AVAILABLE,
  getAlertIsPermanentlyIgnored,
} from '../../../redux/alerts'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import type { State } from '../../../redux/types'

export interface RobotBusyAndUpdateAlertEnabled {
  isRobotBusy: boolean
  isUpdateAlertEnabled: boolean | null
}

export function useRobotBusyAndUpdateAlertEnabled(): RobotBusyAndUpdateAlertEnabled {
  const isUpdateAlertEnabled = useSelector((state: State) => {
    const ignored = getAlertIsPermanentlyIgnored(
      state,
      ALERT_APP_UPDATE_AVAILABLE
    )
    return ignored !== null ? !ignored : null
  })
  const robotHasCurrentRun = useCurrentRunId() !== null
  const allSessionsQueryResponse = useAllSessionsQuery()
  const isRobotBusy =
    robotHasCurrentRun ||
    (allSessionsQueryResponse?.data?.data != null &&
      allSessionsQueryResponse?.data?.data?.length !== 0)

  return { isRobotBusy, isUpdateAlertEnabled }
}
