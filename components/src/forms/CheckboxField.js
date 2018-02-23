// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '../icons'

import styles from './forms.css'

type Props = {
  /** change handler */
  onChange: (event: SyntheticInputEvent<*>) => mixed,
  /** checkbox is checked if value is true */
  value?: boolean,
  /** classes to apply */
  className?: string,
  /** label text for checkbox */
  label?: string,
  /** if is included, checkbox will use error style. The content of the string is ignored. */
  error?: ?string
}

export default function CheckboxField (props: Props) {
  const error = props.error != null
  return (
    <label className={cx(styles.form_field, props.className)}>
      <div className={cx(styles.checkbox_icon, {[styles.error]: error})}>
        <Icon name={props.value ? 'checked box' : 'unchecked box'} width='100%' />
      </div>
      <input
        className={cx(styles.input_field, styles.accessibly_hidden)}
        type='checkbox'
        checked={props.value || false}
        onChange={props.onChange}
      />
      <div className={styles.label_text}>{props.label}</div>
    </label>
  )
}
