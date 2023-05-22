import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { css } from 'styled-components'
import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  Icon,
  Btn,
  BORDERS,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'

import type { IconName } from '@opentrons/components'

const CARD_BUTTON_STYLE = css`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  border-radius: ${BORDERS.size4};
  padding: ${SPACING.spacing32};
  box-shadow: none;

  &:focus {
    background-color: ${COLORS.mediumBluePressed};
    box-shadow: none;
  }

  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.mediumBlueEnabled};
    color: ${COLORS.darkBlackEnabled};
  }

  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.mediumBlueEnabled};
  }

  &:active {
    background-color: ${COLORS.mediumBluePressed};
  }

  &:disabled {
    background-color: ${COLORS.darkBlack20};
    color: ${COLORS.darkBlack70};
  }
`

const CARD_BUTTON_TEXT_STYLE = css`
  word-wrap: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
`

interface CardButtonProps {
  /**  Header text should be less than 2 words.  */
  title: string
  /**  set an Icon */
  iconName: IconName
  /**  Subtext should be less than 3 lines.  */
  description: string
  /**  The path when clicking a card button */
  destinationPath: string
  /**  make button enabled/disabled */
  disabled?: boolean
}

export function CardButton(props: CardButtonProps): JSX.Element {
  const { title, iconName, description, destinationPath, disabled } = props
  const history = useHistory()

  return (
    <Btn
      onClick={() => history.push(destinationPath)}
      width="100%"
      css={CARD_BUTTON_STYLE}
      backgroundColor={disabled ? COLORS.darkBlack20 : COLORS.mediumBlueEnabled}
      disabled={disabled}
    >
      <Icon
        name={iconName}
        size="3.75rem"
        data-testid={`cardButton_icon_${String(iconName)}`}
        color={disabled ? COLORS.darkBlack60 : COLORS.blueEnabled}
      />
      <Flex marginTop={SPACING.spacing16}>
        <StyledText
          as="h4"
          fontWeight={TYPOGRAPHY.fontWeightBold}
          color={disabled ? COLORS.darkBlack60 : COLORS.darkBlackEnabled}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {title}
        </StyledText>
      </Flex>
      <Flex
        marginTop={SPACING.spacing4}
        width="100%"
        justifyContent={JUSTIFY_CENTER}
      >
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={disabled ? COLORS.darkBlack60 : COLORS.darkBlackEnabled}
          css={CARD_BUTTON_TEXT_STYLE}
        >
          {description}
        </StyledText>
      </Flex>
    </Btn>
  )
}
