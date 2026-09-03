import { css } from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Box, Flex } from '../../primitives'
import {
  ALIGN_CENTER,
  CURSOR_AUTO,
  CURSOR_POINTER,
  JUSTIFY_CENTER,
} from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { ChangeEventHandler, ComponentProps, ReactNode } from 'react'

export interface CheckboxFieldProps {
  /** change handler */
  onChange: ChangeEventHandler
  /** checkbox is checked if value is true */
  value?: boolean
  /** name of field in form */
  name?: string
  /** label text for checkbox */
  label?: ReactNode
  /** checkbox is disabled if value is true */
  disabled?: boolean
  /** html tabindex property */
  tabIndex?: number
  /** props passed into label div. TODO IMMEDIATELY what is the Flow type? */
  labelProps?: ComponentProps<'div'>
  /** if true, render indeterminate icon */
  isIndeterminate?: boolean
  /** optional padding */
  padding?: string
}

export function CheckboxField(props: CheckboxFieldProps): ReactNode {
  const {
    onChange,
    value,
    name,
    label,
    disabled,
    tabIndex = 0,
    padding,
    isIndeterminate,
  } = props
  const indeterminate = (isIndeterminate ?? false) ? 'true' : undefined

  return (
    <label css={OUTER_STYLE(value ?? false)}>
      {(props.isIndeterminate ?? false) ? (
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          borderRadius={BORDERS.borderRadius2}
          backgroundColor={COLORS.grey30}
          size="1.25rem"
        >
          <Box
            height="1.5px"
            width="0.375rem"
            backgroundColor={COLORS.grey50}
          />
        </Flex>
      ) : (
        <Icon
          css={(value ?? false) ? INNER_STYLE_VALUE : INNER_STYLE_NO_VALUE}
          name={(value ?? false) ? 'ot-checkbox' : 'checkbox-blank-outline'}
          width="1.25rem"
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
      <Box css={LABEL_TEXT_STYLE(padding)}>{label}</Box>
    </label>
  )
}

const INPUT_STYLE = css`
  position: absolute;
  overflow: hidden;
  clip-path: inset(50%);
  height: 1px;
  width: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
`

const OUTER_STYLE = (value?: boolean): FlattenSimpleInterpolation => css`
  font-size: var(--fs-body-1); /* from legacy --font-form-default */
  font-weight: var(--fw-regular); /* from legacy --font-form-default */
  color: var(--c-font-dark); /* from legacy --font-form-default */

  display: flex;
  align-items: ${ALIGN_CENTER};
  line-height: 1;

  &:has(input[type='checkbox']:focus-visible) {
    [data-testid='CheckboxField_icon'] {
      color: ${value === true ? COLORS.blue50 : COLORS.grey55};
      outline: 2px solid ${COLORS.blue50};
      outline-offset: 0.25rem;
    }
  }
`

const LABEL_TEXT_STYLE = (padding?: string): FlattenSimpleInterpolation => css`
  font-size: ${TYPOGRAPHY.fontSizeH3};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  line-height: ${TYPOGRAPHY.lineHeight20};
  color: ${COLORS.black90};
  flex: 0 0 auto;
  padding: ${padding ?? SPACING.spacing8};

  &:empty {
    padding: 0;
  }
`

const INNER_STYLE_VALUE = css`
  width: ${SPACING.spacing20};
  min-width: ${SPACING.spacing20};
  color: ${COLORS.blue50};
  display: flex;
  border-radius: ${BORDERS.borderRadius2};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};

  &:hover {
    cursor: ${CURSOR_POINTER};
    color: ${COLORS.blue55};
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
  color: ${COLORS.grey50};
  display: flex;
  border-radius: ${BORDERS.borderRadius2};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};

  &:hover {
    cursor: ${CURSOR_POINTER};
    color: ${COLORS.grey60};
  }

  &:active {
    color: ${COLORS.grey60};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${COLORS.blue50};
  }

  &:disabled {
    color: ${COLORS.grey50};
    cursor: ${CURSOR_AUTO};
  }
`
