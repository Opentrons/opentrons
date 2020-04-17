// @flow
import React, { type Node } from 'react'
import { useConditionalConfirm } from '../../useConditionalConfirm'
import { useSelector, useDispatch } from 'react-redux'
import { ContinueModal } from '@opentrons/components'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
  actions as stepsActions,
} from '../../../ui/steps'
import { Portal } from '../../portals/MainPageModalPortal'
import { getCurrentFormIsPresaved } from '../../../step-forms/selectors'
import { PDTitledList } from '../../lists'
import type { TerminalItemId } from '../../../steplist'

export { TerminalItemLink } from './TerminalItemLink'

type ConfirmModalProps = {|
  onCancelClick: () => mixed,
  onContinueClick: () => mixed,
|}

// TODO IMMEDIATELY do we not have anything like this already??? If not, factor it out :(
const ConfirmModal = (props: ConfirmModalProps) => {
  const { onCancelClick, onContinueClick } = props

  return (
    <Portal>
      <ContinueModal
        heading="TODO are you sure?"
        onCancelClick={onCancelClick}
        onContinueClick={onContinueClick}
      >
        foo
      </ContinueModal>
    </Portal>
  )
}

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
        <ConfirmModal
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
