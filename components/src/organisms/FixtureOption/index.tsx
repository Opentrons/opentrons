import { css } from 'styled-components'
import { Btn, Flex } from '../../primitives'
import {
  ALIGN_CENTER,
  CURSOR_DEFAULT,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { BORDERS, COLORS } from '../../helix-design-system'
import { StyledText, TertiaryButton } from '../../atoms'
import type { MouseEventHandler } from 'react'

interface FixtureOptionProps {
  onClickHandler: MouseEventHandler
  optionName: string
  buttonText: string
  isOnDevice: boolean
}
export function FixtureOption(props: FixtureOptionProps): JSX.Element {
  const { onClickHandler, optionName, buttonText, isOnDevice } = props
  return isOnDevice ? (
    <Btn
      onClick={props.onClickHandler}
      display="flex"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      css={FIXTURE_BUTTON_STYLE_ODD}
    >
      <StyledText
        desktopStyle="bodyDefaultRegular"
        oddStyle="bodyTextRegular"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {props.optionName}
      </StyledText>
      <StyledText desktopStyle="bodyDefaultRegular" oddStyle="bodyTextRegular">
        {props.buttonText}
      </StyledText>
    </Btn>
  ) : (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
      backgroundColor={COLORS.grey20}
      borderRadius={BORDERS.borderRadius4}
    >
      <StyledText css={TYPOGRAPHY.pSemiBold}>{optionName}</StyledText>
      <TertiaryButton buttonType="primary" onClick={onClickHandler}>
        {buttonText}
      </TertiaryButton>
    </Flex>
  )
}

const FIXTURE_BUTTON_STYLE_ODD = css`
  background-color: ${COLORS.grey35};
  cursor: ${CURSOR_DEFAULT};
  border-radius: ${BORDERS.borderRadius16};
  box-shadow: none;

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
