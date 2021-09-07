import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
  getIsMultiSelectMode,
  actions as stepsActions,
  SelectTerminalItemAction,
  HoverOnTerminalItemAction,
} from '../../../ui/steps'
import {
  getCurrentFormIsPresaved,
  getCurrentFormHasUnsavedChanges,
} from '../../../step-forms/selectors'
import {
  ConfirmDeleteModal,
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
} from '../../modals/ConfirmDeleteModal'
import { PDTitledList } from '../../lists'
import { TerminalItemId } from '../../../steplist'

export { TerminalItemLink } from './TerminalItemLink'

export interface TerminalItemProps {
  children?: React.ReactNode
  id: TerminalItemId
  title: string
}

export const TerminalItem = (props: TerminalItemProps): JSX.Element => {
  const { id, title, children } = props

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
      {/* @ts-expect-error(sa, 2021-6-21): type mismatch with useConditionalConfirm. see https://github.com/Opentrons/opentrons/issues/8054 */}
      <PDTitledList
        {...{
          id: `TerminalItem_${id}`,
          hovered,
          selected,
          title,
          children,
          onClick: onClick,
          onMouseEnter,
          onMouseLeave,
        }}
      />
    </>
  )
}
