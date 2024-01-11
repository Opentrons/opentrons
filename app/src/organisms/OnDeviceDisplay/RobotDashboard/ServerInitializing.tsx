import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
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
      backgroundColor={COLORS.grey35}
      flexDirection={DIRECTION_COLUMN}
      height="27.25rem"
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.borderRadiusSize3}
      gridGap={SPACING.spacing32}
    >
      <Icon name="ot-spinner" spin size="6rem" color={COLORS.grey60} />
      <StyledText
        as="h4"
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        color={COLORS.grey60}
      >
        {t('robot_initializing')}
      </StyledText>
    </Flex>
  )
}
