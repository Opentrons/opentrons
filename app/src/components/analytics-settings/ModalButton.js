// @flow
// TODO(mc, 2018-05-30): move to or replace with something from components lib
import { type ButtonProps, OutlineButton } from '@opentrons/components'
import * as React from 'react'

import styles from './styles.css'

export function ModalButton(props: ButtonProps): React.Node {
  return <OutlineButton {...props} className={styles.modal_button} />
}
