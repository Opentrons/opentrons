import { EQUIPMENT_POLL_MS } from '../constants'
import { useSelector } from 'react-redux'
import type { State } from '../../../../../redux/types'
import { getRobotSettings } from '../../../../../redux/robot-settings'
import { useIsFlex } from '../../../hooks'
import { useDoorQuery } from '@opentrons/react-api-client'

export function useIsDoorOpen(robotName: string, isFlex: boolean): boolean {
  const robotSettings = useSelector((state: State) =>
    getRobotSettings(state, robotName)
  )

  const doorSafetySetting = robotSettings.find(
    setting => setting.id === 'enableDoorSafetySwitch'
  )
  const { data: doorStatus } = useDoorQuery({
    refetchInterval: EQUIPMENT_POLL_MS,
  })

  let isDoorOpen: boolean
  const isStatusOpen = doorStatus?.data.status === 'open'
  const isDoorSafetyEnabled = Boolean(doorSafetySetting?.value)

  if (isFlex || (!isFlex && isDoorSafetyEnabled)) {
    isDoorOpen = isStatusOpen
  } else {
    isDoorOpen = false
  }

  return isDoorOpen
}
