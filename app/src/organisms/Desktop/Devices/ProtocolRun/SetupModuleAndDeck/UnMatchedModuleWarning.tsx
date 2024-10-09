import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Banner,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

export const UnMatchedModuleWarning = (): JSX.Element | null => {
  const { t } = useTranslation('protocol_setup')
  const [showBanner, setShowBanner] = useState<boolean>(true)
  if (!showBanner) return null

  return (
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
          data-testid="UnMatchedModuleWarning_title"
        >
          {t('extra_module_attached')}
        </LegacyStyledText>

        <LegacyStyledText as="p" data-testid="UnMatchedModuleWarning_body">
          {`${t('module_mismatch_body')}.`}
        </LegacyStyledText>
      </Flex>
    </Banner>
  )
}
