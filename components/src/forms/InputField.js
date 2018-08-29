// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '../icons'
// import globalStyles from '../styles/index.css'
import styles from './forms.css'

type Props = {
  /** field is disabled if value is true */
  disabled?: boolean,
  /** change handler */
  onChange?: (event: SyntheticInputEvent<*>) => mixed,
  /** classes to apply */
  className?: string,
  /** inline label text */
  label?: string,
  /** placeholder text */
  placeholder?: string,
  /** optional units string, appears to the right of input text */
  units?: string,
  /** current value of text in box, defaults to '' */
  value?: ?string,
  /** if included, InputField will use error style and display error instead of caption */
  error?: ?string,
  /** optional caption. hidden when `error` is given */
  caption?: ?string,
  /** appears to the right of the caption. Used for character limits, eg '0/45' */
  secondaryCaption?: ?string,
  /** optional input type (default "text") */
  type?: 'text' | 'password',
  /** mouse click handler */
  onClick?: (event: SyntheticMouseEvent<*>) => mixed,
  /** focus handler */
  onFocus?: (event: SyntheticFocusEvent<*>) => mixed,
  /** blur handler */
  onBlur?: (event: SyntheticFocusEvent<*>) => mixed,
  /** makes input field read-only */
  readOnly?: ?boolean
}

export default function InputField (props: Props) {
  const error = props.error != null
  const labelClass = cx(styles.form_field, props.className, {
    [styles.error]: error,
    [styles.disabled]: props.disabled
  })

  if (!props.label) {
    return (
      <div className={labelClass}>
        <Input {...props} />
      </div>
    )
  }

  return (
    <label className={labelClass}>
      <div className={styles.label_text}>
        {props.label && error &&
          <div className={styles.error_icon}>
            <Icon name='alert' />
          </div>
        }
        {props.label}
      </div>
      <Input {...props} />
    </label>
  )
}

// TODO(mc, 2018-02-21): maybe simplify further and split out?
function Input (props: Props) {
  const error = props.error != null

  return (
    <div className={styles.input_field_container}>
      <div className={styles.input_field}>
        <input
          type={props.type || 'text'}
          value={props.value || ''}
          placeholder={props.placeholder}
          onChange={props.disabled ? undefined : props.onChange}
          onFocus={props.disabled ? undefined : props.onFocus}
          onBlur={props.onBlur}
          onClick={props.disabled ? undefined : props.onClick}
          readOnly={props.readOnly}
        />
        {props.units && <div className={styles.suffix}>{props.units}</div>}
      </div>
      <div className={styles.input_caption}>
        <span>{error ? props.error : props.caption}</span>
        <span className={styles.right}>{props.secondaryCaption}</span>
      </div>
    </div>
  )
}
