// @flow
import React, { type Node } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
  actions as stepsActions,
} from '../../../ui/steps'
import { getCurrentFormIsPresaved } from '../../../step-forms/selectors'
import { ConfirmDeleteStepModal } from '../../modals/ConfirmDeleteStepModal'
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

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    selectItem,
    currentFormIsPresaved
  )

  return (
    <>
      {showConfirmation && (
        <ConfirmDeleteStepModal
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )}
      <PDTitledList
        {...{
          hovered,
          selected,
          title,
          children,
          onClick: confirm,
          onMouseEnter,
          onMouseLeave,
        }}
      />
    </>
  )
}
