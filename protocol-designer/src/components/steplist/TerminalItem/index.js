// @flow
import { useConditionalConfirm } from '@opentrons/components'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getCurrentFormIsPresaved } from '../../../step-forms/selectors'
import type { TerminalItemId } from '../../../steplist'
import {
  actions as stepsActions,
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
} from '../../../ui/steps'
import { PDTitledList } from '../../lists'
import { ConfirmDeleteStepModal } from '../../modals/ConfirmDeleteStepModal'

export { TerminalItemLink } from './TerminalItemLink'

type Props = {|
  children?: React.Node,
  id: TerminalItemId,
  title: string,
|}

export const TerminalItem = (props: Props): React.Node => {
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
