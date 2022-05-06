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

export function PipetteOffsetCalHeader(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} marginX={SPACING.spacing4}>
      <Flex flexDirection={DIRECTION_ROW}>
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          marginRight={SPACING.spacing4}
          width="10rem"
          data-testid={'pipette_offset_calibrations_model_and_serial'}
        >
          {t('table_header_model_and_serial')}
        </StyledText>
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          marginRight={SPACING.spacing4}
          width="2.5rem"
          data-testid={'pipette_offset_calibrations_mount'}
        >
          {t('table_header_mount')}
        </StyledText>
        {/* <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          marginRight={SPACING.spacing4}
          width="3.75rem"
          data-testid={'pipette_offset_calibrations_attached'}
        >
          {t('table_header_attached')}
        </StyledText> */}
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          marginRight={SPACING.spacing4}
          width="8.5rem"
          data-testid={'pipette_offset_calibrations_tiprack'}
        >
          {t('table_header_tiprack')}
        </StyledText>

        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          width="5.5rem"
          data-testid={'pipette_offset_calibrations_last_calibrated'}
        >
          {t('table_header_last_calibrated')}
        </StyledText>
      </Flex>
    </Flex>
  )
}
