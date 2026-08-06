import { useEffect, useState } from 'react'

import { getDefaultsForStepType } from '/protocol-designer/steplist'

import { getVacuumProfileModeType } from '../utils/getVacuumProfileModeType'

import type { FormData, VacuumProfileItem } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/types'

export type UseVacuumModeUpdateResult =
  | {
      showVacuumModeUpdateModal: true
      handleConfirmVacuumModeUpdate: () => void
      handleCancelVacuumModeUpdate: () => void
    }
  | {
      showVacuumModeUpdateModal: false
    }

export function useVacuumModeUpdate(
  formData: FormData,
  propsForFields: FieldPropsByName
): UseVacuumModeUpdateResult {
  const [showVacuumModeUpdateModal, setShowVacuumModeUpdateModal] =
    useState<boolean>(false)

  const isVacuumWithProfile =
    formData.stepType === 'vacuum' &&
    formData.vacuumOrderedProfileIds.length > 0

  const firstProfileId = formData.vacuumOrderedProfileIds?.[0]
  const firstProfileItem =
    firstProfileId != null
      ? formData.vacuumProfileItemsById?.[firstProfileId]
      : undefined
  const savedProfileModeType =
    firstProfileItem != null
      ? getVacuumProfileModeType(firstProfileItem as VacuumProfileItem)
      : null

  const handleConfirmVacuumModeUpdate = (): void => {
    propsForFields.vacuumOrderedProfileIds.updateValue(
      getDefaultsForStepType('vacuum').vacuumOrderedProfileIds
    )
    propsForFields.vacuumProfileItemsById.updateValue(
      getDefaultsForStepType('vacuum').vacuumProfileItemsById
    )
    setShowVacuumModeUpdateModal(false)
  }

  const handleCancelVacuumModeUpdate = (): void => {
    propsForFields.modeType.updateValue(savedProfileModeType)
    setShowVacuumModeUpdateModal(false)
  }

  useEffect(() => {
    if (
      isVacuumWithProfile &&
      savedProfileModeType != null &&
      savedProfileModeType !== formData.modeType
    ) {
      setShowVacuumModeUpdateModal(true)
    }
  }, [formData, isVacuumWithProfile, savedProfileModeType])

  return showVacuumModeUpdateModal
    ? {
        showVacuumModeUpdateModal,
        handleConfirmVacuumModeUpdate,
        handleCancelVacuumModeUpdate,
      }
    : { showVacuumModeUpdateModal }
}
