// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'

import { AlertModal } from '@opentrons/components'
import removeTrashSrc from '../../assets/images/remove-trash@3x.png'
import { Portal } from '../portal'
import styles from './styles.css'

export type ClearDeckAlertModalProps = {|
  onContinueClick?: () => mixed,
  onCancelClick?: () => mixed,
  parentUrl?: string,
  cancelText: string,
  continueText: string,
  removeTrash?: boolean,
  children?: React.Node,
|}

const HEADING = 'Before continuing, please remove:'

export function ClearDeckAlertModal(
  props: ClearDeckAlertModalProps
): React.Node {
  const {
    onContinueClick,
    onCancelClick,
    parentUrl,
    cancelText,
    continueText,
    removeTrash = false,
  } = props

  return (
    <Portal>
      <AlertModal
        heading={HEADING}
        buttons={[
          {
            children: `${cancelText}`,
            onClick: onCancelClick,
            ...(parentUrl != null ? { Component: Link, to: parentUrl } : {}),
          },
          {
            children: `${continueText}`,
            className: styles.alert_button,
            onClick: onContinueClick,
          },
        ]}
        alertOverlay
      >
        <div className={styles.alert_instructions}>
          <ul className={styles.alert_list}>
            <li>All labware from the deck</li>
            <li>All tips from pipettes</li>
            {removeTrash && <li>The removable trash bin</li>}
          </ul>
          {removeTrash && (
            <img className={styles.alert_diagram} src={removeTrashSrc} />
          )}
        </div>
        {props.children != null && (
          <div>
            <p className={styles.alert_note_heading}>Note:</p>
            {props.children}
          </div>
        )}
      </AlertModal>
    </Portal>
  )
}
