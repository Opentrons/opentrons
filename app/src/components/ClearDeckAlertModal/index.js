// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import {AlertModal} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  onContinueClick?: () => mixed,
  parentUrl: string,
  cancelText: string,
  continueText: string,
  children?: React.Node
}
const HEADING = 'Before continuing, remove from deck:'

export default function ClearDeckAlertModal (props: Props) {
  const {onContinueClick, parentUrl, cancelText, continueText} = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {children: `${cancelText}`, Component: Link, to: parentUrl},
        {
          children: `${continueText}`,
          className: styles.alert_button,
          onClick: onContinueClick
        }
      ]}
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
  )
}
