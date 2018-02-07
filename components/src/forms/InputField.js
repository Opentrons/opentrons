// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '../icons'
// import globalStyles from '../styles/index.css'
import styles from './forms.css'

type Props = {
  /** change handler */
  onChange: (event: SyntheticEvent<>) => void,
  /** classes to apply */
  className?: string,
  /** inline label text */
  label?: string,
  /** placeholder text */
  placeholder?: string,
  /** optional units string, appears to the right of input text */
  units?: string,
  /** current value of text in box, defaults to '' */
  value?: string,
  /** if included, InputField will use error style and display error instead of caption */
  error?: ?string,
  /** optional caption. hidden when `error` is given */
  caption?: string,
  /** appears to the right of the caption. Used for character limits, eg '0/45' */
  secondaryCaption?: string
}

export default function InputField (props: Props) {
  const error = props.error != null
  return (
    <label className={cx(styles.form_field, props.className, {[styles.error]: error})}>
      <div className={styles.label_text}>
        {props.label && error &&
          <div className={styles.error_icon}>
            <Icon name='alert' />
          </div>
        }
        {props.label}
      </div>
      <div>
        <div className={styles.input_field}>
          <input
            type='text' /* TODO: support number ? */
            value={props.value || ''}
            placeholder={props.placeholder}
            onChange={props.onChange}
          />
          {props.units && <div className={styles.suffix}>{props.units}</div>}
        </div>
        <div className={styles.input_caption}>
          <span>{error ? props.error : props.caption}</span>
          <span className={styles.right}>{props.secondaryCaption}</span>
        </div>
      </div>
    </label>
  )
}
