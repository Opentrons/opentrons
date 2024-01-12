import * as React from 'react'
import { css } from 'styled-components'
import { LEGACY_COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { Flex, Box } from '../../primitives'
import { Icon } from '../../icons'
import { ALIGN_CENTER, JUSTIFY_CENTER, SIZE_1 } from '../../styles'

export interface CheckboxFieldProps {
  /** change handler */
  onChange: React.ChangeEventHandler
  /** checkbox is checked if value is true */
  value?: boolean
  /** name of field in form */
  name?: string
  /** label text for checkbox */
  label?: React.ReactNode
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
  height: 1px;
  width: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
`
const OUTER_STYLE = css`
  @apply --font-form-default;

  display: flex;
  align-items: ${ALIGN_CENTER};
  line-height: 1;
`

const INNER_STYLE_VALUE = css`
  width: ${SPACING.spacing20};
  min-width: ${SPACING.spacing20};
  color: ${LEGACY_COLORS.blueEnabled};
  display: flex;
  border-radius: 1px;
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};

  &:hover {
    cursor: pointer;
    color: ${LEGACY_COLORS.blueHover};
  }

  &:active {
    color: ${COLORS.blue60};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${COLORS.blue50};
  }
  &:disabled {
    color: ${COLORS.blue60};
  }
`

const INNER_STYLE_NO_VALUE = css`
  width: ${SPACING.spacing20};
  min-width: ${SPACING.spacing20};
  color: ${LEGACY_COLORS.darkGreyEnabled};
  display: flex;
  border-radius: 1px;
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};

  &:hover {
    cursor: pointer;
    color: ${LEGACY_COLORS.darkGreyHover};
  }

  &:active {
    color: ${LEGACY_COLORS.darkGreyPressed};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${COLORS.blue50};
  }

  &:disabled {
    color: ${LEGACY_COLORS.darkGreyPressed};
  }
`

const LABEL_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSizeP};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  color: ${COLORS.black90};
  flex: 0 0 auto;
  padding: ${SPACING.spacing8} ${SPACING.spacing8};

  &:empty {
    padding: 0;
  }
`

export function CheckboxField(props: CheckboxFieldProps): JSX.Element {
  const {
    onChange,
    value,
    name,
    label,
    disabled,
    tabIndex = 0,
    isIndeterminate,
  } = props
  const indeterminate = isIndeterminate ?? false ? 'true' : undefined

  return (
    <label css={OUTER_STYLE}>
      {props.isIndeterminate ?? false ? (
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          borderRadius="2px"
          backgroundColor={LEGACY_COLORS.darkGreyDisabled}
          size={SIZE_1}
        >
          <Box
            height="1.5px"
            width="0.375rem"
            backgroundColor={LEGACY_COLORS.darkGreyEnabled}
          />
        </Flex>
      ) : (
        <Icon
          css={value ?? false ? INNER_STYLE_VALUE : INNER_STYLE_NO_VALUE}
          name={value ?? false ? 'ot-checkbox' : 'checkbox-blank-outline'}
          width="100%"
          data-testid="CheckboxField_icon"
        />
      )}
      <input
        css={INPUT_STYLE}
        type="checkbox"
        name={name}
        checked={(value ?? false) || false}
        disabled={disabled}
        onChange={onChange}
        tabIndex={tabIndex}
        /* @ts-expect-error */
        indeterminate={indeterminate}
      />
      <Box css={LABEL_TEXT_STYLE} tabIndex={tabIndex}>
        {label}
      </Box>
    </label>
  )
}
