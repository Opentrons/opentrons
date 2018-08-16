// @flow
import * as React from 'react'
import cx from 'classnames'

import {CheckboxField} from '@opentrons/components'
import LabeledControl from './LabeledControl'
import styles from './styles.css'

type Props = {
  label: string,
  name: string,
  value: boolean,
  className?: string,
  children: React.Node,
  onChange: (event: SyntheticInputEvent<*>) => mixed,
}

export default function LabeledCheckbox (props: Props) {
  const {label, value, name, onChange} = props
  const checkboxClass = cx(styles.labeled_checkbox, props.className)
  return (
    <LabeledControl
      label={label}
      control={(
        <CheckboxField
          className={checkboxClass}
          name={name}
          value={value}
          onChange={onChange}
        />
      )}
    >
      {props.children}
    </LabeledControl>
  )
}
