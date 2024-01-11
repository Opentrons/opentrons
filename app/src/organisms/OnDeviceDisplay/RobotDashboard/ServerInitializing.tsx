import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  LEGACY_COLORS,
  COLORS,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  BORDERS,
  Icon,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

export function ServerInitializing(): JSX.Element {
  const { t } = useTranslation('device_details')
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={LEGACY_COLORS.darkBlack20}
      flexDirection={DIRECTION_COLUMN}
      height="27.25rem"
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.borderRadiusSize3}
      gridGap={SPACING.spacing32}
    >
      <Icon name="ot-spinner" spin size="6rem" color={LEGACY_COLORS.darkBlack70} />
      <StyledText
        as="h4"
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        color={LEGACY_COLORS.darkBlack70}
      >
        {t('robot_initializing')}
      </StyledText>
    </Flex>
  )
}
