import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

import type { IconName } from '@opentrons/components'

// ToDo kj 11/18/2022 props will be updated when the hi-fi is done
// backgroundColor and iconColor might be added to props
interface CardButtonProps {
  cardWidth: string
  cardHeight: string
  title: string
  iconName: IconName
  description: string
  distPath: string
}

export function CardButton(props: CardButtonProps): JSX.Element {
  const {
    cardWidth,
    cardHeight,
    title,
    iconName,
    description,
    distPath,
  } = props
  const { t } = useTranslation('device_settings')
  const history = useHistory()

  return (
    <Flex
      padding="1.5rem"
      flexDirection={DIRECTION_COLUMN}
      role="button"
      onClick={() => history.push(`/${distPath}`)}
      width={cardWidth}
      height={cardHeight}
      backgroundColor={COLORS.medBlue}
    >
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        marginTop="2.5rem"
      >
        <Icon
          name={iconName}
          size="5rem"
          color={COLORS.blueEnabled}
          data-testid={`cardButton_icon_${String(iconName)}`}
        />
      </Flex>
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing5}
      >
        <StyledText
          fontSize="2rem"
          lineHeight="2.75rem"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlackEnabled}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {t(title)}
        </StyledText>
      </Flex>
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        marginTop="0.75rem"
      >
        <StyledText
          fontSize="1.375rem"
          lineHeight="1.875rem"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkBlackEnabled}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {t(description)}
        </StyledText>
      </Flex>
    </Flex>
  )
}
