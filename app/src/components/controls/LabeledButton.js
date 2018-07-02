// @flow
import * as React from 'react'
import cx from 'classnames'

import {OutlineButton, type ButtonProps} from '@opentrons/components'
import ControlInfo from './ControlInfo'
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
    <div className={styles.labeled_control_wrapper}>
      <div className={styles.labeled_control}>
        <p className={styles.labeled_control_label}>
          {label}
        </p>
        <OutlineButton {...buttonProps} className={buttonClass} />
      </div>
      <ControlInfo>
        {props.children}
      </ControlInfo>
    </div>
  )
}
