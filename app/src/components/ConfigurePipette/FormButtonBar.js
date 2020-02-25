// @flow
import * as React from 'react'

import { BottomButtonBar } from '../modals'

import styles from './styles.css'

import type { ButtonProps } from '@opentrons/components'

export type FormButtonBarProps = {|
  buttons: Array<?ButtonProps>,
|}

export function FormButtonBar(props: FormButtonBarProps) {
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
