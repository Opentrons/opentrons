import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Banner,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
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
          <LegacyStyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            data-testid="PipetteRecalibrationWarning_title"
          >
            {t('pipette_recalibration_recommended')}
          </LegacyStyledText>

          <LegacyStyledText
            as="p"
            data-testid="PipetteRecalibrationWarning_body"
          >
            {`${t('pipette_calibrations_differ')}`}
          </LegacyStyledText>
        </Flex>
      </Banner>
    </Box>
  )
}
