import { useEffect, useState } from 'react'

import {
  useRobotSettingsQuery,
  useUpdateRobotSettingMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

// not releveant to the OT-2, this controls the front LED lights on the Flex
export function useDisableStackerSensors(): {
  sensorsDisabled: boolean
  toggleSensors: () => void
} {
  const [sensorDisabledCache, setSensorsDisabledCache] =
    useState<boolean>(false)
  const documentationState = useDocumentationState()

  const { updateRobotSetting } =
    useUpdateRobotSettingMutation(documentationState)

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
