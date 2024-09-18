import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
  getIsMultiSelectMode,
  actions as stepsActions,
} from '../../../../ui/steps'
import {
  getCurrentFormIsPresaved,
  getCurrentFormHasUnsavedChanges,
} from '../../../../step-forms/selectors'
import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
} from '../../../../components/modals/ConfirmDeleteModal'
import { StepContainer } from './StepContainer'

import type {
  SelectTerminalItemAction,
  HoverOnTerminalItemAction,
} from '../../../../ui/steps'
import type { TerminalItemId } from '../../../../steplist'

export interface TerminalItemStepProps {
  id: TerminalItemId
  title: string
}

export function TerminalItemStep(props: TerminalItemStepProps): JSX.Element {
  const { id, title } = props
  const hovered = useSelector(getHoveredTerminalItemId) === id
  const selected = useSelector(getSelectedTerminalItemId) === id
  const currentFormIsPresaved = useSelector(getCurrentFormIsPresaved)
  const formHasChanges = useSelector(getCurrentFormHasUnsavedChanges)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)

  const dispatch = useDispatch()

  const selectItem = (): SelectTerminalItemAction =>
    dispatch(stepsActions.selectTerminalItem(id))

  const onMouseEnter = (): HoverOnTerminalItemAction =>
    dispatch(stepsActions.hoverOnTerminalItem(id))
  const onMouseLeave = (): HoverOnTerminalItemAction =>
    dispatch(stepsActions.hoverOnTerminalItem(null))

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    selectItem,
    currentFormIsPresaved || formHasChanges
  )

  const onClick = isMultiSelectMode ? () => null : confirm

  return (
    <>
      {showConfirmation && (
        <ConfirmDeleteModal
          modalType={
            currentFormIsPresaved
              ? CLOSE_UNSAVED_STEP_FORM
              : CLOSE_STEP_FORM_WITH_CHANGES
          }
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )}
      <StepContainer
        {...{
          stepId: `TerminalItem_${id}`,
          iconName: 'arrow-right',
          hovered,
          selected,
          title,
          onClick,
          onMouseEnter,
          onMouseLeave,
        }}
      />
    </>
  )
}
