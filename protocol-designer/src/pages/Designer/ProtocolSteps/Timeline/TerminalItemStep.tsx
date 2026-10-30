import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { useConditionalConfirm } from '@opentrons/components'

import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
} from '/protocol-designer/components/organisms'
import {
  getCurrentFormHasUnsavedChanges,
  getCurrentFormIsPresaved,
} from '/protocol-designer/step-forms/selectors'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import {
  getHoveredTerminalItemId,
  getIsMultiSelectMode,
  getSelectedTerminalItemId,
  actions as stepsActions,
} from '/protocol-designer/ui/steps'
import {
  deselectAllSteps,
  hoverOnStep,
  selectDropdownItem,
  toggleViewSubstep,
} from '/protocol-designer/ui/steps/actions/actions'

import { ConnectedStepContainer } from './ConnectedStepContainer'

import type { ReactNode } from 'react'
import type { TerminalItemId } from '/protocol-designer/steplist'
import type { ThunkDispatch } from '/protocol-designer/types'
import type {
  HoverOnTerminalItemAction,
  SelectTerminalItemAction,
} from '/protocol-designer/ui/steps'

export interface TerminalItemStepProps {
  id: TerminalItemId
  sidebarWidth: number
}

export function TerminalItemStep(props: TerminalItemStepProps): ReactNode {
  const { id, sidebarWidth } = props
  const { t } = useTranslation('protocol_steps')
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
    dispatch(
      selectDropdownItem({
        selection: null,
        mode: 'clear',
      })
    )
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
      <ConnectedStepContainer
        {...{
          stepId: `TerminalItem_${id}`,
          iconName: id === START_TERMINAL_ITEM_ID ? 'ot-start' : 'ot-end',
          hovered,
          selected,
          stepNumber: null,
          text:
            id === START_TERMINAL_ITEM_ID
              ? t('starting_deck')
              : t('ending_deck'),
          subtext: null,
          onClick,
          onMouseEnter,
          onMouseLeave,
        }}
        sidebarWidth={sidebarWidth}
      />
    </>
  )
}
