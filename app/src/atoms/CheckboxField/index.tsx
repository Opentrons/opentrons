import * as React from 'react'
import { css } from 'styled-components'
import { Icon, COLORS, Box, SPACING, TYPOGRAPHY } from '@opentrons/components'

export interface CheckboxFieldProps {
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
  height: ${SPACING.spacingXXS};
  width: ${SPACING.spacingXXS};
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
  width: ${SPACING.spacingM};
  min-width: ${SPACING.spacingM};
  color: ${COLORS.blueEnabled};
  display: flex;
  border-radius: ${SPACING.spacingXXS};
  justify-content: center;
  align-items: center;

  &:hover {
    cursor: pointer;
    color: ${COLORS.blueHover};
  }

  &:active {
    color: ${COLORS.bluePressed};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }
  &:disabled {
    color: ${COLORS.bluePressed};
  }
`

const INNER_STYLE_NO_VALUE = css`
  width: ${SPACING.spacingM};
  min-width: ${SPACING.spacingM};
  color: ${COLORS.darkGreyEnabled};
  display: flex;
  border-radius: ${SPACING.spacingXXS};
  justify-content: center;
  align-items: center;

  &:hover {
    cursor: pointer;
    color: ${COLORS.darkGreyHover};
  }

  &:active {
    color: ${COLORS.darkGreyPressed};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }
  &:disabled {
    color: ${COLORS.darkGreyPressed};
  }
`

const LABEL_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSizeP};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  color: ${COLORS.darkBlackEnabled};
  flex: 0 0 auto;
  padding: ${SPACING.spacing3} ${SPACING.spacing3};

  &:empty {
    padding: 0;
  }
`

export function CheckboxField(props: CheckboxFieldProps): JSX.Element {
  const indeterminate = props.isIndeterminate ? 'true' : undefined

  return (
    <label css={OUTER_STYLE}>
      {props.isIndeterminate ? (
        <Icon name="minus-box" width="100%" css={INNER_STYLE_VALUE} />
      ) : (
        <Icon
          css={props.value ? INNER_STYLE_VALUE : INNER_STYLE_NO_VALUE}
          name={props.value ? 'ot-checkbox' : 'checkbox-blank-outline'}
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
        tabIndex={0}
        /* @ts-expect-error */
        indeterminate={indeterminate}
      />
      <Box css={LABEL_TEXT_STYLE} tabIndex={0}>
        {props.label}
      </Box>
    </label>
  )
}
