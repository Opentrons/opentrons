import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'

export function NoParameter(): JSX.Element {
  const { t } = useTranslation('protocol_details')

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      backgroundColor={COLORS.grey30}
      borderRadius={BORDERS.borderRadius8}
      padding={`${SPACING.spacing40} ${SPACING.spacing16}`}
      data-testid="NoRunTimeParameter"
    >
      <Icon
        name="ot-alert"
        size="1.25rem"
        color={COLORS.grey60}
        aria-label="alert"
      />
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('no_parameters')}
      </StyledText>
    </Flex>
  )
}
