import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchSettings,
  getRobotSettings,
  updateSetting,
} from '/app/redux/robot-settings'
import type { RobotSettings } from '/app/redux/robot-settings/types'
import type { Dispatch, State } from '/app/redux/types'

// not releveant to the OT-2, this controls the front LED lights on the Flex
export function useLEDLights(
  robotName: string
): {
  lightsEnabled: boolean
  toggleLights: () => void
} {
  const [lightsEnabledCache, setLightsEnabledCache] = useState<boolean>(true)

  const dispatch = useDispatch<Dispatch>()

  const isStatusBarEnabled =
    useSelector<State, RobotSettings>((state: State) =>
      getRobotSettings(state, robotName)
    ).find(setting => setting.id === 'disableStatusBar')?.value !== true

  useEffect(() => {
    setLightsEnabledCache(isStatusBarEnabled)
  }, [isStatusBarEnabled])

  useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  const toggleLights = (): void => {
    dispatch(updateSetting(robotName, 'disableStatusBar', lightsEnabledCache))
    setLightsEnabledCache(!lightsEnabledCache)
  }

  return { lightsEnabled: lightsEnabledCache, toggleLights }
}
