import * as React from 'react'
import cx from 'classnames'

import { OutlineButton } from '../buttons'
import { LabeledControl } from './LabeledControl'
import styles from './styles.css'

import type { ButtonProps } from '../buttons'

export type LabeledButtonProps = {
  label: string,
  buttonProps: ButtonProps,
  children,
}

export function LabeledButton(props: LabeledButtonProps): React.ReactNode {
  const { label, buttonProps } = props
  const buttonClass = cx(styles.labeled_button, buttonProps.className)

  return (
    <LabeledControl
      label={label}
      control={<OutlineButton {...buttonProps} className={buttonClass} />}
    >
      {props.children}
    </LabeledControl>
  )
}
