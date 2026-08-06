import { useEffect, useState } from 'react'

import {
  useErrorRecoverySettings,
  useUpdateErrorRecoverySettings,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

export interface UseERSettingsToggleResult {
  isEREnabled: boolean
  toggleERSettings: () => void
}

export function useErrorRecoverySettingsToggle(): UseERSettingsToggleResult {
  const [isEREnabled, setIsEREnabled] = useState(true)

  const documentationState = useDocumentationState()
  const { data } = useErrorRecoverySettings()
  const { updateErrorRecoverySettings } =
    useUpdateErrorRecoverySettings(documentationState)
  const isEREnabledData = data?.data.enabled ?? true

  useEffect(() => {
    if (isEREnabledData != null) {
      setIsEREnabled(isEREnabledData as boolean)
    }
  }, [isEREnabledData])

  const toggleERSettings = (): void => {
    const newIsEREnabled = !isEREnabled
    setIsEREnabled(newIsEREnabled)
    updateErrorRecoverySettings(
      { data: { enabled: newIsEREnabled } },
      {
        onError: () => {
          setIsEREnabled(isEREnabled)
        },
      }
    )
  }

  return { isEREnabled, toggleERSettings }
}
