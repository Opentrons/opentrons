// @flow
import * as React from 'react'
import cx from 'classnames'
// import globalStyles from '../styles/index.css'
import styles from './forms.css'

type Props = {
  /* change handler */
  onChange: (event: SyntheticEvent<>) => void,
  /* classes to apply */
  className?: string,
  /* label text */
  label?: string,
  /* placeholder text */
  placeholder?: string,
  /* optional units string, appears to the right of input text */
  units?: string,
  /* current value of text in box, defaults to '' */
  value?: string
}

export default function InputField (props: Props) {
  return (
    <label className={cx(styles.form_field, props.className)}>
      <div className={styles.label_text}>{props.label}</div>
      <div className={styles.input_field}>
        <input
          type='text' /* TODO: support number ? */
          value={props.value || ''}
          placeholder={props.placeholder}
          onChange={props.onChange}
        />
        {props.units && <div className={styles.suffix}>{props.units}</div>}
      </div>
    </label>
  )
}
