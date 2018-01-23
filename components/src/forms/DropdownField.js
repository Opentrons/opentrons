// @flow
import * as React from 'react'
import {Icon} from '..'
import styles from './forms.css'

type Props = {
  /** change handler */
  onChange: (event: SyntheticEvent<>) => void,
  /** value that is selected */
  value?: string,
  /** Array of {name, value} data */
  options?: Array<{
    name: string,
    value: string
  }>,
  /** classes to apply */
  className?: string
}

export default function DropdownField (props: Props) {
  return (
    <div className={styles.dropdown_field}>
      <select value={props.value} onChange={props.onChange} className={styles.dropdown}>
        {props.options && props.options.map(opt =>
          <option key={opt.value} value={opt.value}>
            {opt.name}
          </option>
        )}
      </select>

      <div className={styles.dropdown_icon}>
        <Icon name='menu down' width='100%' />
      </div>
    </div>
  )
}
