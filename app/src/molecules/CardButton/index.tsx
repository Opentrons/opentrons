import { useNavigate } from 'react-router-dom'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ODD_FOCUS_VISIBLE } from '/app/atoms/buttons/constants'

import type { IconName } from '@opentrons/components'

const CARD_BUTTON_STYLE = css`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  border-radius: ${BORDERS.borderRadius40};
  padding: ${SPACING.spacing32};
  box-shadow: none;

  &:focus {
    background-color: ${COLORS.blue40};
    box-shadow: none;
  }

  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.blue35};
    color: ${COLORS.black90};
  }

  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.blue35};
  }

  &:active {
    background-color: ${COLORS.blue40};
  }

  &:disabled {
    background-color: ${COLORS.grey35};
    color: ${COLORS.grey60};
  }
`

const CARD_BUTTON_TEXT_STYLE = css`
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: normal;
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
  const navigate = useNavigate()

  return (
    <Btn
      onClick={() => {
        navigate(destinationPath)
      }}
      width="100%"
      css={CARD_BUTTON_STYLE}
      backgroundColor={disabled ? COLORS.grey35 : COLORS.blue35}
      disabled={disabled}
    >
      <Icon
        name={iconName}
        size="3.75rem"
        color={disabled ? COLORS.grey50 : COLORS.blue50}
      />
      <Flex marginTop={SPACING.spacing16}>
        <LegacyStyledText
          forwardedAs="h4"
          fontWeight={TYPOGRAPHY.fontWeightBold}
          color={disabled ? COLORS.grey50 : COLORS.black90}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {title}
        </LegacyStyledText>
      </Flex>
      <Flex
        marginTop={SPACING.spacing4}
        width="100%"
        justifyContent={JUSTIFY_CENTER}
      >
        <LegacyStyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={disabled ? COLORS.grey50 : COLORS.black90}
          css={CARD_BUTTON_TEXT_STYLE}
        >
          {description}
        </LegacyStyledText>
      </Flex>
    </Btn>
  )
}
