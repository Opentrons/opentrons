// @flow
import * as React from 'react'
import {
  FlatButton,
  PrimaryButton,
  Modal
} from '@opentrons/components'

import styles from './ConfirmModal.css'
import modalStyles from './modal.css'

type Props = {
  headerText: string,
  onCancel: (event: SyntheticEvent<>) => void,
  onCancelText: string,
  onAction: (event: SyntheticEvent<>) => void,
  onActionText: string,
  hideModal: boolean
}

export default function (props: Props) {
  if (props.hideModal) {
    return null
  }

  return (
    <Modal
      onCloseClick={props.onCancel}
      className={modalStyles.modal}
      contentsClassName={modalStyles.modal_contents}
    >
      <div>
        <h2>{props.headerText}</h2>
        <div className={styles.button_row}>
          <FlatButton onClick={props.onCancel}>{props.onCancelText}</FlatButton>
          <PrimaryButton onClick={props.onAction} styles={styles.cancel_button}>{props.onActionText}</PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}
