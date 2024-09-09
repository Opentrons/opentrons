import { useSelector } from 'react-redux'

import { useDoorQuery } from '@opentrons/react-api-client'

import { getRobotSettings } from '../../../../../redux/robot-settings'
import { useIsFlex } from '../../../hooks'
import { EQUIPMENT_POLL_MS } from '../constants'

import type { State } from '../../../../../redux/types'

export function useIsDoorOpen(robotName: string): boolean {
  const robotSettings = useSelector((state: State) =>
    getRobotSettings(state, robotName)
  )
  const isFlex = useIsFlex(robotName)

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
