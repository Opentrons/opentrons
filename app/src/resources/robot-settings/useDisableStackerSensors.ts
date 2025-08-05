import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  fetchSettings,
  getRobotSettings,
  updateSetting,
} from '/app/redux/robot-settings'

import type { RobotSettings } from '/app/redux/robot-settings/types'
import type { Dispatch, State } from '/app/redux/types'

// not releveant to the OT-2, this controls the front LED lights on the Flex
export function useDisableStackerSensors(
  robotName: string
): {
  sensorsDisabled: boolean
  toggleSensors: () => void
} {
  const [sensorDisabledCache, setSensorsDisabledCache] = useState<boolean>(
    false
  )

  const dispatch = useDispatch<Dispatch>()

  const sensorsDisabledFromSettings =
    useSelector<State, RobotSettings>((state: State) =>
      getRobotSettings(state, robotName)
    ).find(setting => setting.id === 'disableFlexStackerLabwareDetection')
      ?.value === true

  useEffect(() => {
    setSensorsDisabledCache(sensorsDisabledFromSettings)
  }, [sensorsDisabledFromSettings])

  useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  const toggleSensors = (): void => {
    setSensorsDisabledCache(!sensorDisabledCache)
    dispatch(
      updateSetting(
        robotName,
        'disableFlexStackerLabwareDetection',
        !sensorDisabledCache
      )
    )
  }

  return { sensorsDisabled: sensorDisabledCache, toggleSensors }
}
