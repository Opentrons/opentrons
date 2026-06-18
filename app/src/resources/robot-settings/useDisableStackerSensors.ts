import { useEffect, useState } from 'react'

import {
  useRobotSettingsQuery,
  useUpdateRobotSettingMutation,
} from '@opentrons/react-api-client'

// not releveant to the OT-2, this controls the front LED lights on the Flex
export function useDisableStackerSensors(robotName: string): {
  sensorsDisabled: boolean
  toggleSensors: () => void
} {
  const [sensorDisabledCache, setSensorsDisabledCache] =
    useState<boolean>(false)

  const { updateRobotSetting } = useUpdateRobotSettingMutation()

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
    updateRobotSetting({
      id: 'disableFlexStackerLabwareDetection',
      value: !sensorDisabledCache,
    })
  }

  return { sensorsDisabled: sensorDisabledCache, toggleSensors }
}
