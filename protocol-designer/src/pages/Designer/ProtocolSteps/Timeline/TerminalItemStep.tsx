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
import {
  deselectAllSteps,
  hoverOnStep,
  toggleViewSubstep,
} from '../../../../ui/steps/actions/actions'
import { StepContainer } from './StepContainer'

import type {
  SelectTerminalItemAction,
  HoverOnTerminalItemAction,
} from '../../../../ui/steps'
import type { TerminalItemId } from '../../../../steplist'
import type { ThunkDispatch } from '../../../../types'

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

  const dispatch = useDispatch<ThunkDispatch<any>>()

  const selectItem = (): SelectTerminalItemAction =>
    dispatch(stepsActions.selectTerminalItem(id))
  const onMouseEnter = (): HoverOnTerminalItemAction =>
    dispatch(stepsActions.hoverOnTerminalItem(id))
  const onMouseLeave = (): HoverOnTerminalItemAction =>
    dispatch(stepsActions.hoverOnTerminalItem(null))
  const handleConfirm = (): void => {
    dispatch(toggleViewSubstep(null))
    dispatch(hoverOnStep(null))
    selectItem()
  }
  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    handleConfirm,
    currentFormIsPresaved || formHasChanges
  )

  const onClick = isMultiSelectMode
    ? () => {
        dispatch(deselectAllSteps('EXIT_BATCH_EDIT_MODE_BUTTON_PRESS'))
        handleConfirm()
      }
    : confirm

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
          iconName: title === 'Starting deck state' ? 'ot-start' : 'ot-end',
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
