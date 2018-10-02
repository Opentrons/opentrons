// @flow
// AlertModal for updating to newest app version
import * as React from 'react'

import {AlertModal} from '@opentrons/components'
import {BottomButtonBar} from './'
import {Portal} from '../portal'

import styles from './styles.css'

import type {ButtonProps} from '@opentrons/components'

type Props = {
  heading: string,
  children: React.Node,
  buttons: Array<?ButtonProps>,
}

export default function ScrollableAlertModal (props: Props) {
  return (
    <Portal>
      <AlertModal
        heading={props.heading}
        className={styles.update_modal}
        contentsClassName={styles.update_modal_contents}
        alertOverlay
      >
        <div className={styles.update_modal_scroll}>
          {props.children}
        </div>
        <BottomButtonBar buttons={props.buttons}/>
      </AlertModal>
    </Portal>
  )
}
