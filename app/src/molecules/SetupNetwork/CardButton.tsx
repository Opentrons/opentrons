import * as React from 'react'
import { useHistory } from 'react-router-dom'
import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  Icon,
  Btn,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

import type { IconName } from '@opentrons/components'

// ToDo kj 11/18/2022 props will be updated when the hi-fi is done
interface CardButtonProps {
  cardWidth: string
  cardHeight: string
  title: string
  iconName: IconName
  description: string
  destinationPath: string
}

export function CardButton(props: CardButtonProps): JSX.Element {
  const {
    cardWidth,
    cardHeight,
    title,
    iconName,
    description,
    destinationPath,
  } = props
  const history = useHistory()

  return (
    <Btn
      display="flex"
      padding={SPACING.spacing5}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing5}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      onClick={() => history.push(`/${destinationPath}`)}
      width={cardWidth}
      height={cardHeight}
      backgroundColor={COLORS.medBlue}
      borderRadius="16px"
    >
      <Icon
        name={iconName}
        size="5rem"
        color={COLORS.blueEnabled}
        data-testid={`cardButton_icon_${String(iconName)}`}
      />
      <Flex>
        <StyledText
          fontSize="2rem"
          lineHeight="2.75rem"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlackEnabled}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {title}
        </StyledText>
      </Flex>
      <Flex marginTop="0.75rem">
        <StyledText
          fontSize="1.375rem"
          lineHeight="1.875rem"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkBlackEnabled}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {description}
        </StyledText>
      </Flex>
    </Btn>
  )
}
