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
  lightsDisabled: boolean
  toggleLights: () => void
} {
  const [lightsDisabledCache, setLightsDisabledCache] = React.useState<boolean>(
    false
  )

  console.log({ lightsDisabledCache })

  const dispatch = useDispatch()

  const isStatusBarDisabled =
    useSelector<State, RobotSettings>((state: State) =>
      getRobotSettings(state, robotName)
    ).find(setting => setting.id === 'disableStatusBar')?.value === true

  React.useEffect(() => {
    setLightsDisabledCache(isStatusBarDisabled)
  }, [isStatusBarDisabled])

  React.useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  const toggleLights = (): void => {
    dispatch(updateSetting(robotName, 'disableStatusBar', !lightsDisabledCache))
    setLightsDisabledCache(!lightsDisabledCache)
  }

  return { lightsDisabled: lightsDisabledCache, toggleLights }
}
