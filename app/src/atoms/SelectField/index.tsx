import * as React from 'react'
import find from 'lodash/find'
import { Select } from './Select'
import { COLORS, Flex, TYPOGRAPHY } from '@opentrons/components'
import { css } from 'styled-components'

import type { SelectProps } from './Select'

export interface SelectFieldProps {
  /** optional HTML id for container */
  id?: SelectProps['id']
  /** field name */
  name: NonNullable<SelectProps['name']>
  /** react-Select option, usually label, value */
  options: NonNullable<SelectProps['options']>
  /** currently selected value */
  value?: string | null
  /** disable the select */
  disabled?: SelectProps['isDisabled']
  /** optional placeholder  */
  placeholder?: SelectProps['placeholder']
  /** menuPosition prop to send to react-select */
  menuPosition?: SelectProps['menuPosition']
  /** render function for the option label passed to react-select */
  formatOptionLabel?: SelectProps['formatOptionLabel']
  /** optional caption. hidden when `error` is given */
  caption?: React.ReactNode
  /** if included, use error style and display error instead of caption */
  error?: string | null
  /** change handler called with (name, value) */
  onValueChange: (name: string, value: string) => void
  /** blur handler called with (name) */
  onLoseFocus?: (name: string) => void
}

const CAPTION_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSizeCaption};

  &.error {
    color: ${COLORS.error};
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  }
`

export function SelectField(props: SelectFieldProps): JSX.Element {
  const {
    id,
    name,
    options,
    disabled,
    placeholder,
    menuPosition,
    formatOptionLabel,
    error,
    onValueChange,
    onLoseFocus,
  } = props
  // @ts-expect-error(mc, 2021-03-19): resolve this error
  const allOptions = options.flatMap(og => og.options || [og])
  const value = find(allOptions, opt => opt.value === props.value) || null
  const caption = error || props.caption

  return (
    <>
      <Select
        id={id}
        name={name}
        options={options}
        value={value}
        isDisabled={disabled}
        placeholder={placeholder}
        menuPosition={menuPosition}
        formatOptionLabel={formatOptionLabel}
        //  @ts-expect-error(jr, 7/6/22): value will never be multi value select option
        onChange={opt => onValueChange?.(name, opt?.value || '')}
        onBlur={() => onLoseFocus?.(name)}
      />
      {caption && <Flex css={CAPTION_STYLE}>{caption}</Flex>}
    </>
  )
}
