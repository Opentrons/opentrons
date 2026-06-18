import { useEffect, useState } from 'react'

import {
  useRobotSettingsQuery,
  useUpdateRobotSettingMutation,
} from '@opentrons/react-api-client'

// not releveant to the OT-2, this controls the front LED lights on the Flex
export function useLEDLights(robotName: string): {
  lightsEnabled: boolean
  toggleLights: () => void
} {
  const [lightsEnabledCache, setLightsEnabledCache] = useState<boolean>(true)

  const { updateRobotSetting } = useUpdateRobotSettingMutation()

  const robotSettingsQuery = useRobotSettingsQuery()
  const settings = robotSettingsQuery.data?.settings ?? []
  const isStatusBarEnabled =
    settings.find(setting => setting.id === 'disableStatusBar')?.value !== true

  useEffect(() => {
    setLightsEnabledCache(isStatusBarEnabled)
  }, [isStatusBarEnabled])

  const toggleLights = (): void => {
    updateRobotSetting({ id: 'disableStatusBar', value: lightsEnabledCache })
    setLightsEnabledCache(!lightsEnabledCache)
  }

  return { lightsEnabled: lightsEnabledCache, toggleLights }
}
