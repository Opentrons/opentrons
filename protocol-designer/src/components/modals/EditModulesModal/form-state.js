// @flow
import { useEffect } from 'react'
import { useFormikContext } from 'formik'
import { isModuleWithCollisionIssue } from '../../modules/utils'
import { usePrevious } from '@opentrons/components'

export const useResetSlotOnModelChange = () => {
  const { values, setValues } = useFormikContext()

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
