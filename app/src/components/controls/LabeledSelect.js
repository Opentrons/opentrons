// @flow
import * as React from 'react'

import {DropdownField} from '@opentrons/components'
import LabeledControl from './LabeledControl'
import styles from './styles.css'

type Props = React.ElementProps<typeof DropdownField> & {
  label: string,
  children: React.Node,
}

export default function LabeledSelect (props: Props) {
  const {label, value, options, onChange} = props

  return (
    <LabeledControl
      label={label}
      control={(
        <DropdownField
          className={styles.labeled_select}
          value={value}
          options={options}
          onChange={onChange}
        />
      )}
    >
      {props.children}
    </LabeledControl>
  )
}
