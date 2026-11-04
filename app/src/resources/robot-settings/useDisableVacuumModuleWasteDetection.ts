import { useEffect, useState } from 'react'

import {
  useRobotSettingsQuery,
  useUpdateRobotSettingMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

const DISABLE_VACUUM_MODULE_WASTE_DETECTION =
  'disableVacuumModuleWasteDetection'

export function useDisableVacuumModuleWasteDetection(): {
  wasteDetectionDisabled: boolean
  toggleWasteDetection: () => void
} {
  const [wasteDetectionDisabledCache, setWasteDetectionDisabledCache] =
    useState<boolean>(false)
  const documentationState = useDocumentationState()

  const { updateRobotSetting } =
    useUpdateRobotSettingMutation(documentationState)

  const robotSettingsQuery = useRobotSettingsQuery()
  const settings = robotSettingsQuery.data?.settings ?? []
  const wasteDetectionDisabledFromSettings =
    settings.find(
      setting => setting.id === DISABLE_VACUUM_MODULE_WASTE_DETECTION
    )?.value === true

  useEffect(() => {
    setWasteDetectionDisabledCache(wasteDetectionDisabledFromSettings)
  }, [wasteDetectionDisabledFromSettings])

  const toggleWasteDetection = (): void => {
    const newWasteDetectionDisabled = !wasteDetectionDisabledCache
    setWasteDetectionDisabledCache(newWasteDetectionDisabled)
    updateRobotSetting(
      {
        id: DISABLE_VACUUM_MODULE_WASTE_DETECTION,
        value: newWasteDetectionDisabled,
      },
      {
        onError: () => {
          setWasteDetectionDisabledCache(wasteDetectionDisabledCache)
        },
      }
    )
  }

  return {
    wasteDetectionDisabled: wasteDetectionDisabledCache,
    toggleWasteDetection,
  }
}
