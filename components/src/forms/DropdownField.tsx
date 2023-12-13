import * as React from 'react'
import cx from 'classnames'

import { Icon } from '..'
import styles from './forms.module.css'

export interface DropdownOption {
  name: string
  value: string
  disabled?: boolean
}

export type Options = DropdownOption[]

export interface DropdownFieldProps {
  /** change handler */
  onChange: React.ChangeEventHandler<HTMLSelectElement>
  /** focus handler */
  onFocus?: React.FocusEventHandler<HTMLSelectElement>
  /** blur handler */
  onBlur?: React.FocusEventHandler<HTMLSelectElement>
  /** value that is selected */
  value?: string | null | undefined
  /** optional id for the <select> element */
  id?: string
  /** name of field in form */
  name?: string
  /** Array of {name, value} data */
  options: Options
  /** classes to apply */
  className?: string
  /** optional caption. hidden when `error` is given */
  caption?: string
  /** if included, DropdownField will use error style and display error instead of caption */
  error?: string | null | undefined
  /** dropdown is disabled if value is true */
  disabled?: boolean
  /** html tabindex property */
  tabIndex?: number
  /** automatically focus field on render */
  autoFocus?: boolean
  /** if true, render indeterminate unselectable option */
  isIndeterminate?: boolean
}

const BLANK_OPTION: DropdownOption = { name: '', value: '' }
const INDETERMINATE_OPTION: DropdownOption = {
  name: '-',
  value: '',
  disabled: true,
}

export function DropdownField(props: DropdownFieldProps): JSX.Element {
  let options = []
  // add in disabled, unselectable "-" mixed option when isIndeterminate is true
  // add in "blank" option if there is no `value`, unless `options` already has a blank option
  if (props.isIndeterminate) {
    options = [INDETERMINATE_OPTION, ...props.options]
  } else if (props.value || props.options.some(opt => opt.value === '')) {
    options = props.options
  } else {
    options = [BLANK_OPTION, ...props.options]
  }

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
            <option
              key={opt.value}
              value={opt.value}
              disabled={Boolean(opt.disabled)}
            >
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
