import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { useRobotSettingsQuery } from '@opentrons/react-api-client'

import { updateSetting } from '/app/redux/robot-settings'

import type { Dispatch } from '/app/redux/types'

// not releveant to the OT-2, this controls the front LED lights on the Flex
export function useLEDLights(robotName: string): {
  lightsEnabled: boolean
  toggleLights: () => void
} {
  const [lightsEnabledCache, setLightsEnabledCache] = useState<boolean>(true)

  const dispatch = useDispatch<Dispatch>()

  const robotSettingsQuery = useRobotSettingsQuery()
  const settings = robotSettingsQuery.data?.settings ?? []
  const isStatusBarEnabled =
    settings.find(setting => setting.id === 'disableStatusBar')?.value !== true

  useEffect(() => {
    setLightsEnabledCache(isStatusBarEnabled)
  }, [isStatusBarEnabled])

  const toggleLights = (): void => {
    dispatch(updateSetting(robotName, 'disableStatusBar', lightsEnabledCache))
    setLightsEnabledCache(!lightsEnabledCache)
  }

  return { lightsEnabled: lightsEnabledCache, toggleLights }
}
