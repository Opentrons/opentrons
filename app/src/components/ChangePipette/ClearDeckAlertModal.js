// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import type {Robot, Mount} from '../../robot'
import {AlertModal} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  robot: Robot,
  mount: Mount,
  closeUrl: string,
  moveToFront: () => mixed,
}

const HEADING = 'Before continuing, remove from deck:'
const CANCEL_TEXT = 'cancel'
const CONTINUE_TEXT = 'move pipette to front'

export default function ChangePipette (props: Props) {
  const {moveToFront, closeUrl} = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {children: CANCEL_TEXT, Component: Link, to: closeUrl},
        {
          children: CONTINUE_TEXT,
          className: styles.alert_button,
          onClick: moveToFront
        }
      ]}
    >
      <ul className={styles.alert_list}>
        <li>All tipracks</li>
        <li>All labware</li>
      </ul>
    </AlertModal>
  )
}
