// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import {AlertModal} from '@opentrons/components'
import {Portal} from '../portal'
import styles from './styles.css'

type Props = {
  onContinueClick?: () => mixed,
  onCancelClick?: () => mixed,
  parentUrl: string,
  cancelText: string,
  continueText: string,
  children?: React.Node
}
const HEADING = 'Before continuing, remove from deck:'

export default function ClearDeckAlertModal (props: Props) {
  const {onContinueClick, onCancelClick, parentUrl, cancelText, continueText} = props

  return (
    <Portal>
      <AlertModal
        heading={HEADING}
        buttons={[
          {children: `${cancelText}`, Component: Link, to: parentUrl, onClick: onCancelClick},
          {
            children: `${continueText}`,
            className: styles.alert_button,
            onClick: onContinueClick
          }
        ]}
        alertOverlay
      >
        <ul className={styles.alert_list}>
          <li>All tipracks</li>
          <li>All labware</li>
        </ul>
        {props.children && (
          <div>
            <p className={styles.alert_note_heading}>
              Note:
            </p>
            {props.children}
          </div>
          )
        }
      </AlertModal>
    </Portal>
  )
}
