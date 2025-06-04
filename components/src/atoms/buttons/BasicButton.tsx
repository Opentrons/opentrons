import styled from 'styled-components'

import { COLORS } from '../../helix-design-system'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { StyledText } from '../StyledText/StyledText'

import type { MouseEvent, ReactNode } from 'react'

interface BasicButtonProps {
  children: ReactNode // Children prop to allow any ReactNode content
  onClick: (event: MouseEvent<HTMLButtonElement>) => void // Function to handle button click events
  isDisabled?: boolean // Optional prop to control button aria-disabled
  underLine?: boolean // Optional prop to control underline styling
  tabIndex?: number // Optional prop for tab index
}

export function BasicButton({
  children,
  onClick,
  isDisabled = false,
  underLine = false,
  tabIndex = 0,
  ...props
}: BasicButtonProps): JSX.Element {
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
      onClick={handleButtonClick}
      aria-disabled={isDisabled || undefined}
      underLine={underLine}
      tabIndex={tabIndex}
      {...props}
    >
      <StyledText desktopStyle="bodyDefaultRegular">{children}</StyledText>
    </StyledButton>
  )
}

const StyledButton = styled.button<{
  underLine?: boolean
  'aria-disabled'?: boolean
}>`
  background: none;
  border: none;
  padding: 0;

  color: ${props => (props['aria-disabled'] ? COLORS.grey40 : COLORS.black90)};
  cursor: ${props => (props['aria-disabled'] ? 'not-allowed' : 'pointer')};

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
