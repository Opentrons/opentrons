// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { StepSelectionBannerComponent } from './StepSelectionBannerComponent'
import { getSavedStepForms } from '../../step-forms/selectors'
import { getMultiSelectItemIds } from '../../ui/steps/selectors'

const MemoizedStepSelectionBannerComponent = React.memo(
  StepSelectionBannerComponent
)

export const StepSelectionBanner: React.AbstractComponent<{||}> = () => {
  const stepIds = useSelector(getMultiSelectItemIds)
  const allSteps = useSelector(getSavedStepForms)

  if (!stepIds) return null
  const steps = stepIds.map(id => allSteps[id])

  return (
    <MemoizedStepSelectionBannerComponent
      selectedSteps={steps}
      handleExitBatchEdit={() => console.log('TODO: exit batch edit')}
    />
  )
}
