// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '../icons'

import styles from './forms.css'

type CheckboxFieldProps = {
  /* checkbox is checked */
  checked?: boolean,
  /* classes to apply */
  className?: string,
  /* label text for checkbox */
  label?: string,
  /* change handler */
  onChange: (event: SyntheticEvent<>) => void
}

export default function (props: CheckboxFieldProps) {
  return (
    <label className={cx(styles.form_field, props.className)}>
      <Icon className={styles.checkbox_icon} name={props.checked ? 'checked box' : 'unchecked box'} width='1.25rem' />
      <input
        className={cx(styles.input_field, styles.accessibly_hidden)}
        type='checkbox'
        checked={props.checked || false}
        onChange={props.onChange}
      />
      <div className={styles.label_text}>{props.label}</div>
    </label>
  )
}
