import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { useRobotSettingsQuery } from '@opentrons/react-api-client'

import { updateSetting } from '/app/redux/robot-settings'

import type { Dispatch } from '/app/redux/types'

// not releveant to the OT-2, this controls the front LED lights on the Flex
export function useDisableStackerSensors(robotName: string): {
  sensorsDisabled: boolean
  toggleSensors: () => void
} {
  const [sensorDisabledCache, setSensorsDisabledCache] =
    useState<boolean>(false)

  const dispatch = useDispatch<Dispatch>()

  const robotSettingsQuery = useRobotSettingsQuery()
  const settings = robotSettingsQuery.data?.settings ?? []
  const sensorsDisabledFromSettings =
    settings.find(
      setting => setting.id === 'disableFlexStackerLabwareDetection'
    )?.value === true

  useEffect(() => {
    setSensorsDisabledCache(sensorsDisabledFromSettings)
  }, [sensorsDisabledFromSettings])

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
