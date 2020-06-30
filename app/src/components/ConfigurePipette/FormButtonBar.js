// @flow
import * as React from 'react'

import type { ButtonProps } from '@opentrons/components'
import { BottomButtonBar } from '../modals'

import styles from './styles.css'

export type FormButtonBarProps = {|
  buttons: Array<?ButtonProps>,
|}

export function FormButtonBar(props: FormButtonBarProps): React.Node {
  const className = styles.form_button
  const buttons = props.buttons.map(button => ({ ...button, className }))

  return (
    <BottomButtonBar
      buttons={buttons}
      description={
        <p className={styles.reset_message}>
          * To reset an individual setting, simply clear the field.
        </p>
      }
    />
  )
}
