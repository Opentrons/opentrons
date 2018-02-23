// @flow
import * as React from 'react'
import cx from 'classnames'

import {Icon} from '..'
import styles from './forms.css'

export type DropdownOption = {
  name: string,
  value: string,
}

// TODO(mc, 2018-02-22): disabled prop
type Props = {
  /** change handler */
  onChange: (event: SyntheticInputEvent<*>) => void,
  /** value that is selected */
  value?: ?string,
  /** Array of {name, value} data */
  options: Array<DropdownOption>,
  /** classes to apply */
  className?: string,
  /** optional caption. hidden when `error` is given */
  caption?: string,
  /** if included, DropdownField will use error style and display error instead of caption */
  error?: ?string
}

export default function DropdownField (props: Props) {
  // add in "blank" option if there is no `value`, unless `options` already has a blank option
  const options = (props.value || props.options.some(opt => opt.value === ''))
    ? props.options
    : [{name: '', value: ''}, ...props.options]

  const error = props.error != null
  const className = cx(props.className, {[styles.error]: error})

  return (
    <div className={className}>
      <div className={styles.dropdown_field}>
        <select value={props.value || ''} onChange={props.onChange} className={styles.dropdown}>
          {options.map(opt =>
            <option key={opt.value} value={opt.value}>
              {opt.name}
            </option>
          )}
        </select>

        <div className={styles.dropdown_icon}>
          <Icon name='menu down' width='100%' />
        </div>
      </div>
      <div className={styles.input_caption}>
        <span>{error ? props.error : props.caption}</span>
      </div>
    </div>
  )
}
