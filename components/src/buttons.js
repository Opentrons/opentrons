// button components
// @flow

import * as React from 'react'
import classnames from 'classnames'

import styles from './buttons.css'

type ButtonProps = {
  onClick: (event: SyntheticEvent<>) => void,
  title?: string,
  disabled?: bool,
  className?: string,
  children?: React.Node
}

function Button (props: ButtonProps) {
  const {disabled} = props
  const onClick = !disabled && props.onClick

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={props.title}
      className={props.className}
    >
      {props.children}
    </button>
  )
}

export function PrimaryButton (props: ButtonProps) {
  const className = classnames(styles.button_primary, props.className)

  return (
    <Button {...props} className={className}>
      {props.children}
    </Button>
  )
}
