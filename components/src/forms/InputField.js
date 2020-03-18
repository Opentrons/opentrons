// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon } from '../icons'
import styles from './forms.css'

export const INPUT_TYPE_TEXT: 'text' = 'text'
export const INPUT_TYPE_PASSWORD: 'password' = 'password'

// TODO: Ian 2018-09-14 remove 'label' prop when IngredientPropertiesForm gets updated

export type InputFieldProps = {|
  /** field is disabled if value is true */
  disabled?: boolean,
  /** change handler */
  onChange?: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  /** classes to apply to outer element */
  className?: string,
  /** inline label text. DEPRECATED */
  label?: string,
  /** classes to apply to inner label text div */
  labelTextClassName?: ?string,
  /** name of field in form */
  name?: string,
  /** optional ID of <input> element */
  id?: string,
  /** placeholder text */
  placeholder?: string,
  /** optional suffix component, appears to the right of input text */
  units?: React.Node, // TODO: Ian 2018-10-30 rename to 'suffix'
  /** current value of text in box, defaults to '' */
  value?: ?string,
  /** if included, InputField will use error style and display error instead of caption */
  error?: ?string,
  /** optional caption. hidden when `error` is given */
  caption?: ?string,
  /** appears to the right of the caption. Used for character limits, eg '0/45' */
  secondaryCaption?: ?string,
  /** optional input type (default "text") */
  type?: typeof INPUT_TYPE_TEXT | typeof INPUT_TYPE_PASSWORD,
  /** mouse click handler */
  onClick?: (event: SyntheticMouseEvent<HTMLInputElement>) => mixed,
  /** focus handler */
  onFocus?: (event: SyntheticFocusEvent<HTMLInputElement>) => mixed,
  /** blur handler */
  onBlur?: (event: SyntheticFocusEvent<HTMLInputElement>) => mixed,
  /** makes input field read-only */
  readOnly?: ?boolean,
  /** html tabindex property */
  tabIndex?: number,
  /** automatically focus field on render */
  autoFocus?: boolean,
|}

export function InputField(props: InputFieldProps) {
  const error = props.error != null
  const labelClass = cx(styles.form_field, props.className, {
    [styles.error]: error,
    [styles.disabled]: props.disabled,
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
      <div className={cx(props.labelTextClassName, styles.label_text)}>
        {props.label && error && (
          <div className={styles.error_icon}>
            <Icon name="alert" />
          </div>
        )}
        {props.label}
      </div>
      <Input {...props} />
    </label>
  )
}

// TODO(mc, 2018-02-21): maybe simplify further and split out?
function Input(props: InputFieldProps) {
  const error = props.error != null

  return (
    <div className={styles.input_field_container}>
      <div className={styles.input_field}>
        <input
          id={props.id}
          type={props.type ?? INPUT_TYPE_TEXT}
          value={props.value ?? ''}
          name={props.name}
          placeholder={props.placeholder}
          onChange={props.disabled ? undefined : props.onChange}
          onFocus={props.disabled ? undefined : props.onFocus}
          onBlur={props.onBlur}
          onClick={props.disabled ? undefined : props.onClick}
          readOnly={props.readOnly}
          tabIndex={props.tabIndex}
          autoFocus={props.autoFocus}
        />
        {props.units && <div className={styles.suffix}>{props.units}</div>}
      </div>
      {/* TODO(mc, 2018-10-20): do not render if no caption */}
      <div className={styles.input_caption}>
        <span>{error ? props.error : props.caption}</span>
        <span className={styles.right}>{props.secondaryCaption}</span>
      </div>
    </div>
  )
}
