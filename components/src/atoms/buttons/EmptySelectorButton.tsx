import styled from 'styled-components'
import { Flex } from '../../primitives'
import {
  BORDERS,
  COLORS,
  CURSOR_DEFAULT,
  CURSOR_POINTER,
  Icon,
  SPACING,
  StyledText,
  JUSTIFY_CENTER,
  JUSTIFY_START,
  ALIGN_CENTER,
  FLEX_MAX_CONTENT,
} from '../..'
import type { IconName } from '../..'

interface EmptySelectorButtonProps {
  onClick: () => void
  text: string
  textAlignment: 'left' | 'middle'
  iconName?: IconName
  disabled?: boolean
}

//  used for helix and Opentrons Ai
export function EmptySelectorButton(
  props: EmptySelectorButtonProps
): JSX.Element {
  const { onClick, text, iconName, textAlignment, disabled = false } = props

  const StyledButton = styled.button`
    border: none;
    width: ${FLEX_MAX_CONTENT};
    height: ${FLEX_MAX_CONTENT};
    cursor: ${disabled ? CURSOR_DEFAULT : CURSOR_POINTER};
    &:focus-visible {
      outline: 2px solid ${COLORS.white};
      box-shadow: 0 0 0 4px ${COLORS.blue50};
      border-radius: ${BORDERS.borderRadius8};
    }
  `

  return (
    <StyledButton onClick={onClick}>
      <Flex
        gridGap={SPACING.spacing4}
        padding={SPACING.spacing12}
        backgroundColor={disabled ? COLORS.grey30 : COLORS.blue30}
        color={disabled ? COLORS.grey40 : COLORS.black90}
        borderRadius={BORDERS.borderRadius8}
        border={`2px dashed ${disabled ? COLORS.grey40 : COLORS.blue50}`}
        width="100%"
        height="100%"
        alignItems={ALIGN_CENTER}
        data-testid="EmptySelectorButton_container"
        justifyContent={
          textAlignment === 'middle' ? JUSTIFY_CENTER : JUSTIFY_START
        }
      >
        {iconName != null ? (
          <Icon
            name={iconName}
            size="1.25rem"
            data-testid={`EmptySelectorButton_${iconName}`}
          />
        ) : null}
        <StyledText desktopStyle="bodyDefaultSemiBold">{text}</StyledText>
      </Flex>
    </StyledButton>
  )
}
