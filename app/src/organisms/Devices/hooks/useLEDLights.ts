import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../../redux/types'
import { RobotSettings } from '../../../redux/robot-settings/types'
import {
  fetchSettings,
  getRobotSettings,
  updateSetting,
} from '../../../redux/robot-settings'

export function useLights(
  robotName: string
): {
  lightsOn: boolean | null
  toggleLights: () => void
} {
  const [lightsOnCache, setLightsOnCache] = React.useState(false)

  const dispatch = useDispatch()

  const settings = useSelector<State, RobotSettings>((state: State) =>
    getRobotSettings(state, robotName)
  )

  const isStatusBarDisabled =
    settings.find(setting => setting.id === 'disableStatusBar')?.value === true

  React.useEffect(() => {
    setLightsOnCache(isStatusBarDisabled)
  }, [isStatusBarDisabled])

  React.useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  const toggleLights = (): void => {
    setLightsOnCache(!lightsOnCache)
    dispatch(updateSetting(robotName, 'disableStatusBar', !lightsOnCache))
  }

  return { lightsOn: lightsOnCache, toggleLights }
}
