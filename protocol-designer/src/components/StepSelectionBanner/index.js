// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import { selectors as stepFormSelectors } from '../../step-forms'
import { actions as stepActions } from '../../ui/steps'
import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  ConfirmDeleteModal,
} from '../modals/ConfirmDeleteModal'
import {
  StepSelectionBannerComponent,
  type StepSelectionBannerProps,
} from './StepSelectionBannerComponent'

const MemoizedStepSelectionBannerComponent = React.memo(
  StepSelectionBannerComponent
)

export const StepSelectionBanner = (props: {|
  countPerType: $PropertyType<StepSelectionBannerProps, 'countPerType'>,
|}): React.Node => {
  const { countPerType } = props
  const dispatch = useDispatch()

  const batchEditFormHasUnsavedChanges = useSelector(
    stepFormSelectors.getBatchEditFormHasUnsavedChanges
  )

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
        countPerType={countPerType}
        handleExitBatchEdit={confirm}
      />
    </>
  )
}
