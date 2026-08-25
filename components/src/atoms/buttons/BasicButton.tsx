import styled from 'styled-components'

import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Flex } from '../../primitives'
import { ALIGN_CENTER } from '../../styles'
import { CURSOR_NOT_ALLOWED, CURSOR_POINTER } from '../../styles/cursor'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { StyledText } from '../StyledText/StyledText'

import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import type { IconName } from '../../icons'

interface BasicButtonProps {
  children: string // Content of basic button
  type?: ComponentProps<'button'>['type']
  onClick: (event: MouseEvent<HTMLButtonElement>) => void // Function to handle button click events
  isDisabled?: boolean // Optional prop to control button aria-disabled
  underLine?: boolean // Optional prop to control underline styling
  tabIndex?: number // Optional prop for tab index
  iconName?: IconName // Optional prop for icon
}

export function BasicButton({
  children,
  onClick,
  isDisabled = false,
  underLine = false,
  tabIndex = 0,
  iconName,
  ...props
}: BasicButtonProps): ReactNode {
  const handleButtonClick = (event: MouseEvent<HTMLButtonElement>): void => {
    if (isDisabled) {
      event.preventDefault()
      return
    }
    if (onClick != null) {
      onClick(event)
    }
  }

  return (
    <StyledButton
      data-testid={`basic_button_${children}`}
      onClick={handleButtonClick}
      aria-disabled={isDisabled}
      underLine={underLine}
      tabIndex={tabIndex}
      {...props}
    >
      {iconName != null ? (
        <Flex alignItems={ALIGN_CENTER} gap={SPACING.spacing8}>
          <Icon
            name={iconName}
            size="1.25rem"
            data-testid={`basic_button_${iconName}`}
          />
          <StyledText desktopStyle="bodyDefaultRegular">{children}</StyledText>
        </Flex>
      ) : (
        <StyledText desktopStyle="bodyDefaultRegular">{children}</StyledText>
      )}
    </StyledButton>
  )
}

const StyledButton = styled.button<{
  underLine?: boolean
  'aria-disabled'?: boolean
}>`
  background: none;
  border: none;
  padding: ${SPACING.spacing4};

  color: ${props => (props['aria-disabled'] ? COLORS.grey40 : COLORS.black90)};
  cursor: ${props =>
    props['aria-disabled'] ? CURSOR_NOT_ALLOWED : CURSOR_POINTER};

  text-decoration: ${props =>
    props.underLine ? TYPOGRAPHY.textDecorationUnderline : 'none'};

  ${props =>
    !props['aria-disabled']
      ? `
        &:hover {
          color: ${COLORS.blue50};
        }

        &:focus-visible {
          color: ${COLORS.blue50};
          outline: 2px solid ${COLORS.blue50};
          outline-offset: ${SPACING.spacing4};
        }
      `
      : undefined}

  &[aria-disabled="true"] {
    outline: none;
  }
`
