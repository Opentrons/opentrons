import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Btn,
  Flex,
  Icon,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_ROW,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

export function MapViewButton(
  props: React.HTMLProps<HTMLButtonElement>
): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  return (
    <Btn
      position="fixed"
      bottom="1.5rem"
      right="1.5rem"
      backgroundColor={COLORS.highlightPurple_one}
      borderRadius="2.6875rem"
      color={COLORS.white}
      padding={`0.75rem ${SPACING.spacing5}`}
      onClick={props.onClick}
      width="15.25rem"
    >
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing3}
      >
        <Icon name="deck-map" width={SPACING.spacing7} color={COLORS.white} />
        <StyledText as="h1" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('map_view')}
        </StyledText>
      </Flex>
    </Btn>
  )
}
