// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { StepEditForm } from '../StepEditForm'
import { BatchEditForm } from '../BatchEditForm'
import { StepSelectionBanner } from '../StepSelectionBanner'
import { getIsMultiSelectMode } from '../../ui/steps/selectors'

export const FormManager = (): React.Node => {
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)

  if (isMultiSelectMode) {
    return (
      <>
        <StepSelectionBanner />
        <BatchEditForm />
      </>
    )
  }
  return <StepEditForm />
}
