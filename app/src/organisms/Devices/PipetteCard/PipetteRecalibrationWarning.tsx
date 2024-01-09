import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  Box,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'

export const PipetteRecalibrationWarning = (): JSX.Element | null => {
  const { t } = useTranslation('device_details')
  const [showBanner, setShowBanner] = React.useState<boolean>(true)
  if (!showBanner) return null

  return (
    <Box marginTop={SPACING.spacing8} width="100%">
      <Banner
        iconMarginRight={SPACING.spacing16}
        iconMarginLeft={SPACING.spacing8}
        type="warning"
        size={SPACING.spacing20}
        onCloseClick={() => setShowBanner(false)}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            data-testid="PipetteRecalibrationWarning_title"
          >
            {t('pipette_recalibration_recommended')}
          </StyledText>

          <StyledText as="p" data-testid="PipetteRecalibrationWarning_body">
            {`${t('pipette_calibrations_differ')}`}
          </StyledText>
        </Flex>
      </Banner>
    </Box>
  )
}
