// @flow
import * as React from 'react'

import AlertModal from './AlertModal'

type ContinueModalProps = {
  /** cancellation handler (also passed to `Modal`'s `onCloseClick`) */
  onCancelClick: () => void,
  /** continuation handler */
  onContinueClick: () => void,
  /** modal contents */
  children: React.Node,
}

const CANCEL = 'Cancel'
const CONTINUE = 'Continue'

/**
 * AlertModal variant to prompt user to "Cancel" or "Continue" a given action
 */
export default function ContinueModal (props: ContinueModalProps) {
  const {onCancelClick, onContinueClick} = props
  const buttons = [
    {title: CANCEL, children: CANCEL, onClick: onCancelClick},
    {title: CONTINUE, children: CONTINUE, onClick: onContinueClick}
  ]

  return (
    <AlertModal buttons={buttons} onCloseClick={onCancelClick}>
      {props.children}
    </AlertModal>
  )
}
