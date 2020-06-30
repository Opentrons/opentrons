// @flow
import { useEffect } from 'react'
import { useFormikContext } from 'formik'
import { usePrevious } from '@opentrons/components'
import { isModuleWithCollisionIssue } from '../../modules/utils'

export const useResetSlotOnModelChange = (supportedModuleSlot: string) => {
  const { values, setValues } = useFormikContext()

  const selectedModel = values.selectedModel
  const prevSelectedModel = usePrevious(selectedModel)
  useEffect(() => {
    if (
      prevSelectedModel &&
      prevSelectedModel !== selectedModel &&
      isModuleWithCollisionIssue(selectedModel)
    ) {
      setValues({ selectedModel, selectedSlot: supportedModuleSlot })
    }
  })
}
