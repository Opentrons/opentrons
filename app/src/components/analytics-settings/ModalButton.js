// @flow
// TODO(mc, 2018-05-30): move to or replace with something from components lib
import * as React from 'react'

import { OutlineButton, type ButtonProps } from '@opentrons/components'
import styles from './styles.css'

export function ModalButton(props: ButtonProps) {
  return <OutlineButton {...props} className={styles.modal_button} />
}
