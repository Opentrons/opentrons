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
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/OnDeviceDisplay/constants'

import type { IconName } from '@opentrons/components'

const CARD_BUTTON_STYLE = css`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  border-radius: ${BORDERS.size_four};
  padding: ${SPACING.spacing6};

  &:focus {
    background-color: ${COLORS.medBluePressed};
    box-shadow: none;
  }

  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.foundationalBlue};
    color: ${COLORS.darkBlackEnabled};
  }

  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.foundationalBlue}
  }

  &:active {
    background-color: ${COLORS.medBluePressed};

  &:disabled {
    background-color: ${COLORS.darkBlack_twenty};
    color: ${COLORS.darkBlack_seventy};
  }
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
      backgroundColor={
        disabled ? COLORS.darkBlack_twenty : COLORS.foundationalBlue
      }
      disabled={disabled}
    >
      <Icon
        name={iconName}
        size="3.75rem"
        data-testid={`cardButton_icon_${String(iconName)}`}
        color={disabled ? COLORS.darkBlack_sixty : COLORS.blueEnabled}
      />
      <Flex marginTop={SPACING.spacing4}>
        <StyledText
          as="h4"
          fontSize="1.75rem"
          lineHeight="2.25rem"
          fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
          color={disabled ? COLORS.darkBlack_sixty : COLORS.darkBlackEnabled}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {title}
        </StyledText>
      </Flex>
      <Flex marginTop={SPACING.spacing2}>
        <StyledText
          fontSize="1.375rem"
          lineHeight="1.75rem"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={disabled ? COLORS.darkBlack_sixty : COLORS.darkBlackEnabled}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {description}
        </StyledText>
      </Flex>
    </Btn>
  )
}
