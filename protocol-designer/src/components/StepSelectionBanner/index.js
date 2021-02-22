// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import { selectors as stepFormSelectors } from '../../step-forms'
import { actions as stepActions } from '../../ui/steps'
import { getCountPerStepType } from '../../ui/steps/selectors'
import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  ConfirmDeleteModal,
} from '../modals/ConfirmDeleteModal'
import { StepSelectionBannerComponent } from './StepSelectionBannerComponent'

const MemoizedStepSelectionBannerComponent = React.memo(
  StepSelectionBannerComponent
)

export const StepSelectionBanner = (): React.Node => {
  const countPerStepType = useSelector(getCountPerStepType)
  const batchEditFormHasUnsavedChanges = useSelector(
    stepFormSelectors.getBatchEditFormHasUnsavedChanges
  )
  const dispatch = useDispatch()

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    () => dispatch(stepActions.deselectAllSteps()),
    batchEditFormHasUnsavedChanges
  )

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
        countPerStepType={countPerStepType}
        handleExitBatchEdit={confirm}
      />
    </>
  )
}
