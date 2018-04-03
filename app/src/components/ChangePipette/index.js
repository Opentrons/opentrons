// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import type {Robot, Mount} from '../../robot'
import {AlertModal} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  robot: Robot,
  mount: Mount,
  backUrl: string
}

const HEADING = 'Before continuing, remove from deck:'

export default function ChangePipette (props: Props) {
  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {children: 'cancel', Component: Link, to: props.backUrl},
        {children: 'move pipette to front', disabled: true, className: styles.alert_button}
      ]}
    >
      <ul className={styles.alert_list}>
        <li>All tipracks</li>
        <li>All labware</li>
      </ul>
    </AlertModal>
  )
}
