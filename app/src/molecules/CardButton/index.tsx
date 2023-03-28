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

import type { IconName } from '@opentrons/components'

const CARD_BUTTON_STYLE = css`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  border-radius: ${BORDERS.size_four};
  padding: ${SPACING.spacing6};

  &:focus {
    background-color: #99b1d2; // ToDO (kj: 03/28/2023) will be updated when the name is ready
    box-shadow: none;
  }

  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.foundationalBlue};
    color: ${COLORS.darkBlackEnabled};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
  }

  &:active {
    background-color: #99b1d2; // ToDO (kj: 03/28/2023) will be updated when the name is ready
  }

  &:disabled {
    background-color: ${COLORS.darkBlack_twenty};
    color: ${COLORS.darkBlack_seventy};
  }
`

// ToDo kj 11/18/2022 props will be updated when the hi-fi is done
interface CardButtonProps {
  cardWidth: string
  cardHeight: string
  title: string
  iconName: IconName
  description: string
  destinationPath: string
  disabled?: boolean
}

export function CardButton(props: CardButtonProps): JSX.Element {
  const {
    cardWidth,
    cardHeight,
    title,
    iconName,
    description,
    destinationPath,
    disabled,
  } = props
  const history = useHistory()

  return (
    <Btn
      onClick={() => history.push(destinationPath)}
      width={cardWidth}
      height={cardHeight}
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
        color={disabled ? COLORS.darkBlack_seventy : COLORS.blueEnabled}
      />
      <Flex marginTop={SPACING.spacing4}>
        <StyledText
          fontSize="1.75rem"
          lineHeight="2.25rem"
          fontWeight="700"
          color={disabled ? COLORS.darkBlack_seventy : COLORS.darkBlackEnabled}
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
          color={disabled ? COLORS.darkBlack_seventy : COLORS.darkBlackEnabled}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {description}
        </StyledText>
      </Flex>
    </Btn>
  )
}
