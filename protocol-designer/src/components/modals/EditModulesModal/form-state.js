// @flow
import { useEffect } from 'react'
import { useField, useFormikContext } from 'formik'
import { isModuleWithCollisionIssue } from '../../modules/utils'
import { usePrevious } from '@opentrons/components'
import type { EditModulesState } from './'

export const useResetSlotOnModelChange = () => {
  // not sure why flow doesn't like values since I am passing type to the hook
  const { values, setValues } = useFormikContext<EditModulesState>()

  const selectedModel = values.selectedModel
  const selectedSlot = values.selectedSlot
  const prevSelectedModel = usePrevious(selectedModel)
  useEffect(() => {
    if (
      prevSelectedModel &&
      prevSelectedModel !== selectedModel &&
      isModuleWithCollisionIssue(selectedModel)
    ) {
      setValues({ selectedModel, selectedSlot })
    }
  })
}

export const useResetSlotOnModelChangeOld = () => {
  const [field] = useField('selectedModel')
  const setSelectedSlot = useField('selectedSlot')[2].setValue

  const selectedModel = field.value
  const prevSelectedModel = usePrevious(selectedModel)
  useEffect(() => {
    if (
      prevSelectedModel &&
      prevSelectedModel !== selectedModel &&
      isModuleWithCollisionIssue(selectedModel)
    ) {
      setSelectedSlot('1') // pull from supportedValues
    }
  }, [selectedModel, prevSelectedModel, setSelectedSlot])
}
