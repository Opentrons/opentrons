import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Banner,
  Box,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

export const PipetteRecalibrationWarning = (): JSX.Element | null => {
  const { t } = useTranslation('device_details')
  const [showBanner, setShowBanner] = useState<boolean>(true)
  if (!showBanner) return null

  return (
    <Box marginTop={SPACING.spacing8} width="100%">
      <Banner
        iconMarginRight={SPACING.spacing16}
        iconMarginLeft={SPACING.spacing8}
        type="warning"
        size={SPACING.spacing20}
        onCloseClick={() => {
          setShowBanner(false)
        }}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            data-testid="PipetteRecalibrationWarning_title"
          >
            {t('pipette_recalibration_recommended')}
          </StyledText>

          <StyledText
            forwardedAs="p"
            data-testid="PipetteRecalibrationWarning_body"
          >
            {`${t('pipette_calibrations_differ')}`}
          </StyledText>
        </Flex>
      </Banner>
    </Box>
  )
}
