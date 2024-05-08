import * as React from 'react'
import { css } from 'styled-components'
import { COLORS, BORDERS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { Icon } from '../../icons'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
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
  return (
    <Flex
      as="button"
      role="checkbox"
      width="100%"
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      padding={SPACING.spacing20}
      borderRadius={BORDERS.borderRadius16}
      backgroundColor={isChecked ? COLORS.blue50 : COLORS.blue35}
      color={isChecked ? COLORS.white : COLORS.black90}
      onClick={onClick}
      tabIndex={tabIndex}
      disabled={disabled}
      css={css`
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
      `}
    >
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
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
    <Icon name="ot-checkbox" size="1.75rem" color={COLORS.white} />
  ) : (
    <Flex
      size="1.75rem"
      border={`2px solid ${COLORS.black90}`}
      borderRadius={BORDERS.borderRadius4}
    />
  )
}
