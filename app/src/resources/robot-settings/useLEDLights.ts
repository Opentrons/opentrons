import { useEffect, useState } from 'react'

import {
  useRobotSettingsQuery,
  useUpdateRobotSettingMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

// not releveant to the OT-2, this controls the front LED lights on the Flex
export function useLEDLights(): {
  lightsEnabled: boolean
  toggleLights: () => void
} {
  const [lightsEnabledCache, setLightsEnabledCache] = useState<boolean>(true)
  const documentationState = useDocumentationState()

  const { updateRobotSetting } =
    useUpdateRobotSettingMutation(documentationState)

  const robotSettingsQuery = useRobotSettingsQuery()
  const settings = robotSettingsQuery.data?.settings ?? []
  const isStatusBarEnabled =
    settings.find(setting => setting.id === 'disableStatusBar')?.value !== true

  useEffect(() => {
    setLightsEnabledCache(isStatusBarEnabled)
  }, [isStatusBarEnabled])

  const toggleLights = (): void => {
    const newLightsEnabled = !lightsEnabledCache
    setLightsEnabledCache(newLightsEnabled)
    updateRobotSetting(
      { id: 'disableStatusBar', value: lightsEnabledCache },
      {
        onError: () => {
          setLightsEnabledCache(lightsEnabledCache)
        },
      }
    )
  }

  return { lightsEnabled: lightsEnabledCache, toggleLights }
}
