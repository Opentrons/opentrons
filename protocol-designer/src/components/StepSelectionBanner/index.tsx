import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import { selectors as stepFormSelectors } from '../../step-forms'
import { actions as stepActions } from '../../ui/steps'
import { getCountPerStepType } from '../../ui/steps/selectors'
import {
  ConfirmDeleteModal,
  CLOSE_BATCH_EDIT_FORM,
} from '../modals/ConfirmDeleteModal'
import { StepSelectionBannerComponent } from './StepSelectionBannerComponent'
import { ThunkDispatch } from 'redux-thunk'
import { BaseState } from '../../types'

const MemoizedStepSelectionBannerComponent = React.memo(
  StepSelectionBannerComponent
)

export const StepSelectionBanner = (): JSX.Element => {
  const countPerStepType = useSelector(getCountPerStepType)
  const batchEditFormHasUnsavedChanges = useSelector(
    stepFormSelectors.getBatchEditFormHasUnsavedChanges
  )
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    () =>
      dispatch(
        stepActions.deselectAllSteps('EXIT_BATCH_EDIT_MODE_BUTTON_PRESS')
      ),
    batchEditFormHasUnsavedChanges
  )

  return (
    <>
      {showConfirmation && (
        <ConfirmDeleteModal
          modalType={CLOSE_BATCH_EDIT_FORM}
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
