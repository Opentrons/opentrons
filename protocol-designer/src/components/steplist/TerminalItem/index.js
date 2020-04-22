// @flow
import React, { type Node } from 'react'
import { useConditionalConfirm } from '../../useConditionalConfirm'
import { useSelector, useDispatch } from 'react-redux'
import { ConfirmDeleteStepModal } from '../../modals/ConfirmDeleteStepModal'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
  actions as stepsActions,
} from '../../../ui/steps'
import { getCurrentFormIsPresaved } from '../../../step-forms/selectors'
import { PDTitledList } from '../../lists'
import type { TerminalItemId } from '../../../steplist'

export { TerminalItemLink } from './TerminalItemLink'

type Props = {|
  children?: Node,
  id: TerminalItemId,
  title: string,
|}

export const TerminalItem = (props: Props) => {
  const { id, title, children } = props
  // const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

  const hovered = useSelector(getHoveredTerminalItemId) === id
  const selected = useSelector(getSelectedTerminalItemId) === id
  const currentFormIsPresaved = useSelector(getCurrentFormIsPresaved)

  const dispatch = useDispatch()

  const selectItem = () => dispatch(stepsActions.selectTerminalItem(id))

  const onMouseEnter = () => dispatch(stepsActions.hoverOnTerminalItem(id))
  const onMouseLeave = () => dispatch(stepsActions.hoverOnTerminalItem(null))

  const {
    conditionalContinue,
    requiresConfirmation,
    confirmAndContinue,
    cancelConfirm,
  } = useConditionalConfirm(selectItem, currentFormIsPresaved)

  return (
    <>
      {requiresConfirmation && (
        <ConfirmDeleteStepModal
          onContinueClick={confirmAndContinue}
          onCancelClick={cancelConfirm}
        />
      )}
      <PDTitledList
        {...{
          hovered,
          selected,
          title,
          children,
          onClick: conditionalContinue,
          onMouseEnter,
          onMouseLeave,
        }}
      />
    </>
  )
}
