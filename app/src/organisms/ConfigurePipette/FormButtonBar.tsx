import * as React from 'react'

import { BottomButtonBar } from '../../molecules/modals'

import styles from './styles.css'

import type { ButtonProps } from '@opentrons/components'

type MaybeButtonProps = ButtonProps | null | undefined
export interface FormButtonBarProps {
  buttons: MaybeButtonProps[]
}

export function FormButtonBar(props: FormButtonBarProps): JSX.Element {
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
