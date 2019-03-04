// @flow
import * as React from 'react'

import {BottomButtonBar} from '../modals'

import styles from './styles.css'

import type {ButtonProps} from '@opentrons/components'

type Props = {
  buttons: Array<?ButtonProps>,
}

export default function FormButtonBar (props: Props) {
  const className = styles.form_button
  const buttons = props.buttons.map(button => {
    return {
      ...button,
      className,
    }
  })

  return (
    <React.Fragment>
      <p className={styles.reset_message}>
        * To reset an individual setting, simply clear the field.
      </p>
      <BottomButtonBar buttons={buttons} />
    </React.Fragment>
  )
}
