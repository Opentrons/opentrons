// @flow
import * as React from 'react'
import cx from 'classnames'
import find from 'lodash/find'

import { Select } from './Select'
import styles from './SelectField.css'

import type { SelectProps } from './Select'

export type SelectFieldProps = {
  /** optional HTML id for container */
  id?: $PropertyType<SelectProps, 'id'>,
  /** field name */
  name: $NonMaybeType<$PropertyType<SelectProps, 'name'>>,
  /** react-Select option, usually label, value */
  options: $PropertyType<SelectProps, 'options'>,
  /** currently selected value */
  value: $NonMaybeType<$PropertyType<SelectProps, 'id'>> | null,
  /** disable the select */
  disabled?: $PropertyType<SelectProps, 'isDisabled'>,
  /** optional placeholder  */
  placeholder?: $PropertyType<SelectProps, 'placeholder'>,
  /** menuPosition prop to send to react-select */
  menuPosition?: $PropertyType<SelectProps, 'menuPosition'>,
  /** render function for the option label passed to react-select */
  formatOptionLabel?: $PropertyType<SelectProps, 'formatOptionLabel'>,
  /** optional className */
  className?: string,
  /** optional caption. hidden when `error` is given */
  caption?: React.Node,
  /** if included, use error style and display error instead of caption */
  error?: ?string,
  /** change handler called with (name, value) */
  onValueChange?: (name: string, value: string) => mixed,
  /** blur handler called with (name) */
  onLoseFocus?: (name: string) => mixed,
}

export function SelectField(props: SelectFieldProps) {
  const {
    id,
    name,
    options,
    disabled,
    placeholder,
    menuPosition,
    formatOptionLabel,
    className,
    error,
    onValueChange,
    onLoseFocus,
  } = props
  const allOptions = options.flatMap(og => og.options || [og])
  const value = find(allOptions, { value: props.value }) || null
  const caption = error || props.caption
  const captionCx = cx(styles.select_caption, { [styles.error]: error })
  const fieldCx = cx(styles.select_field, { [styles.error]: error }, className)

  return (
    <div>
      <Select
        className={fieldCx}
        id={id}
        name={name}
        options={options}
        value={value}
        isDisabled={disabled}
        placeholder={placeholder}
        menuPosition={menuPosition}
        formatOptionLabel={formatOptionLabel}
        onChange={opt => onValueChange && onValueChange(name, opt?.value || '')}
        onBlur={() => onLoseFocus && onLoseFocus(name)}
      />
      {caption && <p className={captionCx}>{caption}</p>}
    </div>
  )
}
