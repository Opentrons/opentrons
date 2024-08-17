import * as React from 'react'
import { css } from 'styled-components'
import { COLORS, BORDERS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { Icon } from '../../icons'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  FLEX_MAX_CONTENT,
  JUSTIFY_SPACE_BETWEEN,
} from '../../styles'
import { RESPONSIVENESS, SPACING } from '../../ui-style-constants'
import { StyledText } from '../StyledText'

export interface CheckboxProps {
  /** checkbox is checked if value is true */
  isChecked: boolean
  /** label text that describes the option */
  labelText: string
  /** callback click/tap handler */
  onClick: React.MouseEventHandler
  /** html tabindex property */
  tabIndex?: number
  /** if disabled is true, mouse events will not trigger onClick callback */
  disabled?: boolean
}
export function Checkbox(props: CheckboxProps): JSX.Element {
  const {
    isChecked,
    labelText,
    onClick,
    tabIndex = 0,
    disabled = false,
  } = props

  const CHECKBOX_STYLE = css`
    width: ${FLEX_MAX_CONTENT};
    grid-gap: ${SPACING.spacing12};
    align-items: ${ALIGN_CENTER};
    flex-direction: ${DIRECTION_ROW};
    color: ${isChecked ? COLORS.white : COLORS.black90};
    background-color: ${isChecked ? COLORS.blue50 : COLORS.blue35};
    border-radius: ${BORDERS.borderRadiusFull};
    padding: ${SPACING.spacing12} ${SPACING.spacing16};
    justify-content: ${JUSTIFY_SPACE_BETWEEN};
    cursor: pointer;

    &:active {
      background-color: ${isChecked ? COLORS.blue55 : COLORS.blue40};
    }
    &:focus-visible {
      background-color: ${isChecked ? COLORS.blue50 : COLORS.blue35};
      outline: 3px ${BORDERS.styleSolid} ${COLORS.blue50};
      outline-offset: 2px;
    }
    &:disabled {
      background-color: ${COLORS.grey35};
      color: ${COLORS.grey50};
    }

    .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
      padding: ${SPACING.spacing20};
      border-radius: ${BORDERS.borderRadius16};
      width: 100%;
      cursor: auto;
    }
  `

  return (
    <Flex
      as="button"
      role="checkbox"
      onClick={onClick}
      tabIndex={tabIndex}
      disabled={disabled}
      css={CHECKBOX_STYLE}
    >
      <StyledText
        desktopStyle="bodyDefaultSemiBold"
        oddStyle="bodyTextSemiBold"
      >
        {labelText}
      </StyledText>
      <Check isChecked={isChecked} />
    </Flex>
  )
}

interface CheckProps {
  isChecked: boolean
}
function Check(props: CheckProps): JSX.Element {
  return props.isChecked ? (
    <Flex css={CHECK_STYLE}>
      <Icon name="ot-checkbox" color={COLORS.white} />
    </Flex>
  ) : (
    <Flex
      css={CHECK_STYLE}
      border={`2px solid ${COLORS.black90}`}
      borderRadius={BORDERS.borderRadius4}
    />
  )
}

const CHECK_STYLE = css`
  width: 1rem;
  height: 1rem;
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    width: 1.75rem;
    height: 1.75rem;
  }
`
