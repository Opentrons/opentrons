// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import { selectors as stepFormSelectors } from '../../step-forms'
import { actions as stepActions, getMultiSelectItemIds } from '../../ui/steps'
import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  ConfirmDeleteModal,
} from '../modals/ConfirmDeleteModal'
import { StepSelectionBannerComponent } from './StepSelectionBannerComponent'

const MemoizedStepSelectionBannerComponent = React.memo(
  StepSelectionBannerComponent
)

export const StepSelectionBanner: React.AbstractComponent<{||}> = () => {
  const dispatch = useDispatch()
  const stepIds = useSelector(getMultiSelectItemIds)
  const allSteps = useSelector(stepFormSelectors.getSavedStepForms)

  const batchEditFormHasUnsavedChanges = useSelector(
    stepFormSelectors.getBatchEditFormHasUnsavedChanges
  )

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    () => dispatch(stepActions.deselectAllSteps()),
    batchEditFormHasUnsavedChanges
  )

  if (!stepIds) return null
  const steps = stepIds.map(id => allSteps[id])

  return (
    <>
      {showConfirmation && (
        <ConfirmDeleteModal
          modalType={CLOSE_STEP_FORM_WITH_CHANGES}
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )}
      <MemoizedStepSelectionBannerComponent
        selectedSteps={steps}
        handleExitBatchEdit={confirm}
      />
    </>
  )
}
