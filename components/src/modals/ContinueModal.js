// @flow
import * as React from 'react'

import {FlatButton} from '../buttons'
import Modal from './Modal'
import styles from './modals.css'

type ContinueModalProps = {
  /** cancellation handler (also passed to `Modal`'s `onCloseClick`) */
  onCancelClick: (event: SyntheticEvent<>) => void,
  /** continuation handler */
  onContinueClick: (event: SyntheticEvent<>) => void,
  /** modal contents */
  children: React.Node
}

/**
 * Modal to prompt the user to "Cancel" or "Continue" a given action
 */
export default function ContinueModal (props: ContinueModalProps) {
  const {onCancelClick, onContinueClick} = props

  return (
    <Modal onCloseClick={onCancelClick}>
      <div className={styles.continue_modal_contents}>
        {props.children}
      </div>
      <div className={styles.continue_modal_buttons}>
        <FlatButton title='Cancel' onClick={onCancelClick}>
          Cancel
        </FlatButton>
        <FlatButton title='Continue' onClick={onContinueClick}>
          Continue
        </FlatButton>
      </div>
    </Modal>
  )
}
