// @flow
import * as React from 'react'
import cx from 'classnames'

import { Icon } from '..'
import styles from './forms.css'

export type DropdownOption = {|
  name: string,
  value: string,
  disabled?: boolean,
|}

export type Options = Array<DropdownOption>

export type DropdownFieldProps = {|
  /** change handler */
  onChange: (event: SyntheticInputEvent<HTMLSelectElement>) => mixed,
  /** focus handler */
  onFocus?: (event: SyntheticFocusEvent<HTMLSelectElement>) => mixed,
  /** blur handler */
  onBlur?: (event: SyntheticFocusEvent<HTMLSelectElement>) => mixed,
  /** value that is selected */
  value?: ?string,
  /** optional id for the <select> element */
  id?: string,
  /** name of field in form */
  name?: string,
  /** Array of {name, value} data */
  options: Options,
  /** classes to apply */
  className?: string,
  /** optional caption. hidden when `error` is given */
  caption?: string,
  /** if included, DropdownField will use error style and display error instead of caption */
  error?: ?string,
  /** dropdown is disabled if value is true */
  disabled?: boolean,
  /** html tabindex property */
  tabIndex?: number,
  /** automatically focus field on render */
  autoFocus?: boolean,
|}

export function DropdownField(props: DropdownFieldProps) {
  // add in "blank" option if there is no `value`, unless `options` already has a blank option
  const options =
    props.value || props.options.some(opt => opt.value === '')
      ? props.options
      : [{ name: '', value: '' }, ...props.options]

  const error = props.error != null
  const className = cx(props.className, {
    [styles.error]: error,
    [styles.dropdown_disabled]: props.disabled,
  })

  return (
    <div className={className}>
      <div className={styles.dropdown_field}>
        <select
          id={props.id}
          value={props.value || ''}
          name={props.name}
          onChange={props.onChange}
          onBlur={props.onBlur}
          onFocus={props.onFocus}
          disabled={props.disabled}
          className={styles.dropdown}
          tabIndex={props.tabIndex}
          autoFocus={props.autoFocus}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={!!opt.disabled}>
              {opt.name}
            </option>
          ))}
        </select>

        <div className={styles.dropdown_icon}>
          <Icon name="menu-down" width="100%" />
        </div>
      </div>
      <div className={styles.input_caption}>
        <span>{error ? props.error : props.caption}</span>
      </div>
    </div>
  )
}
