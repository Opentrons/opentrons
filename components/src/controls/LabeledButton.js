// @flow
import * as React from 'react'
import cx from 'classnames'

import { OutlineButton, type ButtonProps } from '../buttons'
import { LabeledControl } from './LabeledControl'
import styles from './styles.css'

export type LabeledButtonProps = {|
  label: string,
  buttonProps: ButtonProps,
  children: React.Node,
|}

export function LabeledButton(props: LabeledButtonProps) {
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
