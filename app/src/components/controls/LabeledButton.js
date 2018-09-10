// @flow
import * as React from 'react'
import cx from 'classnames'

import {OutlineButton, type ButtonProps} from '@opentrons/components'
import LabeledControl from './LabeledControl'
import styles from './styles.css'

type Props = {
  label: string,
  buttonProps: ButtonProps,
  children?: React.Node,
}

export default function LabeledButton (props: Props) {
  const {label, buttonProps} = props
  const buttonClass = cx(styles.labeled_button, buttonProps.className)

  return (
    <LabeledControl
      label={label}
      control={(
        <OutlineButton {...buttonProps} className={buttonClass} />
      )}
    >
      {props.children}
    </LabeledControl>
  )
}
