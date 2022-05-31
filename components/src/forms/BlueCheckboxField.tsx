import * as React from 'react'
import { Icon } from '../icons'
import { css } from 'styled-components'
import {
  blue,
  blueHover,
  bluePressed,
  darkGreyEnabled,
  darkGreyHover,
  darkGreyPressed,
  disabled,
  warning,
} from '../ui-style-constants/colors'
import { Box } from '..'
import { spacingXXS } from '../ui-style-constants/spacing'

export interface BlueCheckboxFieldProps {
  /** change handler */
  onChange: React.ChangeEventHandler
  /** checkbox is checked if value is true */
  value?: boolean
  /** name of field in form */
  name?: string
  /** label text for checkbox */
  label?: string
  /** checkbox is disabled if value is true */
  disabled?: boolean
  /** html tabindex property */
  tabIndex?: number
  /** props passed into label div. TODO IMMEDIATELY what is the Flow type? */
  labelProps?: React.ComponentProps<'div'>
  /** if true, render indeterminate icon */
  isIndeterminate?: boolean
}

const INPUT_STYLE = css`
  position: absolute;
  overflow: hidden;
  clip: rect(0 0 0 0);
  height: ${spacingXXS};
  width: ${spacingXXS};
  margin: -1px;
  padding: 0;
  border: 0;
`
const OUTER_STYLE = css`
  @apply --font-form-default;

  display: flex;
  align-items: center;
  line-height: 1;
`

const INNER_STYLE_VALUE = css`
  width: 1.25rem;
  min-width: 1.25rem;
  color: ${blue};
  display: flex;
  border-radius: ${spacingXXS};
  justify-content: center;
  align-items: center;

  &:hover {
    cursor: pointer;
    color: ${blueHover};
  }

  &:active {
    color: ${bluePressed};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${warning};
  }
  &:disabled {
    color: ${disabled};
  }
`

const INNER_STYLE_NO_VALUE = css`
  width: 1.25rem;
  min-width: 1.25rem;
  color: ${darkGreyEnabled};
  display: flex;
  border-radius: ${spacingXXS};
  justify-content: center;
  align-items: center;

  &:hover {
    cursor: pointer;
    color: ${darkGreyHover};
  }

  &:active {
    color: ${darkGreyPressed};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${warning};
  }
  &:disabled {
    color: ${disabled};
  }
`
export function BlueCheckboxField(props: BlueCheckboxFieldProps): JSX.Element {
  const indeterminate = props.isIndeterminate ? 'true' : undefined

  return (
    <label css={OUTER_STYLE}>
      {props.isIndeterminate ? (
        <Icon name={'minus-box'} width="100%" css={INNER_STYLE_VALUE} />
      ) : (
        <Icon
          css={props.value ? INNER_STYLE_VALUE : INNER_STYLE_NO_VALUE}
          name={props.value ? 'checkbox-marked' : 'checkbox-blank-outline'}
          width="100%"
        />
      )}
      <input
        css={INPUT_STYLE}
        type="checkbox"
        name={props.name}
        checked={props.value || false}
        disabled={props.disabled}
        onChange={props.onChange}
        tabIndex={props.tabIndex}
        /* @ts-expect-error */
        indeterminate={indeterminate}
      />
      <Box>{props.label}</Box>
    </label>
  )
}
