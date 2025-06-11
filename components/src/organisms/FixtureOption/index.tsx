import styled from 'styled-components'

import { ListItem } from '../../atoms/ListItem/index'
import { TertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/StyledText'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Btn } from '../../primitives'
import {
  ALIGN_CENTER,
  CURSOR_DEFAULT,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  JUSTIFY_SPACE_BETWEEN,
} from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type { MouseEventHandler } from 'react'

export const FixtureButtonODD = styled(Btn)`
  display: ${DISPLAY_FLEX};
  background-color: ${COLORS.grey35};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  flex-direction: ${DIRECTION_ROW};
  align-items: ${ALIGN_CENTER};
  cursor: ${CURSOR_DEFAULT};
  border-radius: ${BORDERS.borderRadius16};
  box-shadow: none;
  padding: ${SPACING.spacing16} ${SPACING.spacing24};

  &:focus {
    background-color: ${COLORS.grey40};
    box-shadow: none;
  }

  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.grey35};
  }

  &:focus-visible {
    box-shadow: 0 0 0 ${SPACING.spacing4} ${COLORS.blue50};
    background-color: ${COLORS.grey35};
  }

  &:active {
    background-color: ${COLORS.grey40};
  }

  &:disabled {
    background-color: ${COLORS.grey35};
    color: ${COLORS.grey50};
  }
`

interface FixtureOptionProps {
  onClickHandler: MouseEventHandler
  optionName: string
  buttonText: string
  isOnDevice: boolean
}
console.log("Btn: ", Btn)
export function FixtureOption(props: FixtureOptionProps): JSX.Element {
  const { onClickHandler, optionName, buttonText, isOnDevice } = props
  return isOnDevice ? (
    <FixtureButtonODD onClick={onClickHandler}>
      <StyledText
        oddStyle="bodyTextRegular"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {optionName}
      </StyledText>
      <StyledText oddStyle="bodyTextRegular">{buttonText}</StyledText>
    </FixtureButtonODD>
  ) : (
    <ListItem
      type="default"
      gridGap={SPACING.spacing24} // why is this not working
      css="padding: 16px"
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <StyledText desktopStyle="bodyDefaultSemiBold">{optionName}</StyledText>
      <TertiaryButton
        buttonType="primary"
        onClick={onClickHandler}
        data-testid={optionName}
      >
        {buttonText}
      </TertiaryButton>
    </ListItem>
  )
}