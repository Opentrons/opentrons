import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'

export function TipLengthCalHeader(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} marginX={SPACING.spacing4}>
      <Flex flexDirection={DIRECTION_ROW}>
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          width="13.375rem"
          data-testid={'tip_length_calibrations_tiprack'}
        >
          {t('table_header_tiprack')}
        </StyledText>
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          marginLeft={SPACING.spacing4}
          width="11.75rem"
          data-testid={'tip_length_calibrations_model_and_serial'}
        >
          {t('table_header_model_and_serial')}
        </StyledText>
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          marginRight={SPACING.spacing4}
          width="12.5rem"
          data-testid={'tip_length_calibrations_last_calibrated'}
        >
          {t('table_header_last_calibrated')}
        </StyledText>
      </Flex>
    </Flex>
  )
}
