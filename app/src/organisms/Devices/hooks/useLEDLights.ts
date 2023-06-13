import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../../redux/types'
import { RobotSettings } from '../../../redux/robot-settings/types'
import {
  fetchSettings,
  getRobotSettings,
  updateSetting,
} from '../../../redux/robot-settings'

// not releveant to the OT-2, this controls the front LED lights on the Flex
export function useLEDLights(
  robotName: string
): {
  lightsEnabled: boolean
  toggleLights: () => void
} {
  const [lightsEnabledCache, setLightsEnabledCache] = React.useState<boolean>(
    true
  )

  const dispatch = useDispatch()

  const isStatusBarEnabled =
    useSelector<State, RobotSettings>((state: State) =>
      getRobotSettings(state, robotName)
    ).find(setting => setting.id === 'disableStatusBar')?.value !== true

  React.useEffect(() => {
    setLightsEnabledCache(isStatusBarEnabled)
  }, [isStatusBarEnabled])

  React.useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  const toggleLights = (): void => {
    dispatch(updateSetting(robotName, 'disableStatusBar', lightsEnabledCache))
    setLightsEnabledCache(!lightsEnabledCache)
  }

  return { lightsEnabled: lightsEnabledCache, toggleLights }
}
