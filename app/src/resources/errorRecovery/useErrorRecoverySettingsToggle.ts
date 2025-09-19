import { useEffect, useState } from 'react'

import {
  useErrorRecoverySettings,
  useUpdateErrorRecoverySettings,
} from '@opentrons/react-api-client'

export interface UseERSettingsToggleResult {
  isEREnabled: boolean
  toggleERSettings: () => void
}

export function useErrorRecoverySettingsToggle(): UseERSettingsToggleResult {
  const [isEREnabled, setIsEREnabled] = useState(true)

  const { data } = useErrorRecoverySettings()
  const { updateErrorRecoverySettings } = useUpdateErrorRecoverySettings()
  const isEREnabledData = data?.data.enabled ?? true

  useEffect(() => {
    if (isEREnabledData != null) {
      setIsEREnabled(isEREnabledData as boolean)
    }
  }, [isEREnabledData])

  const toggleERSettings = (): void => {
    setIsEREnabled(isEREnabled => {
      updateErrorRecoverySettings({ data: { enabled: !isEREnabled } })
      return !isEREnabled
    })
  }

  return { isEREnabled, toggleERSettings }
}
