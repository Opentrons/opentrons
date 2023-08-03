import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  Box,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { Banner } from '../../../../atoms/Banner'

export const UnMatchedModuleWarning = (): JSX.Element | null => {
  const { t } = useTranslation('protocol_setup')
  const [showBanner, setShowBanner] = React.useState<boolean>(true)
  if (!showBanner) return null

  return (
    <Box marginTop={SPACING.spacing8}>
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
            data-testid="UnMatchedModuleWarning_title"
          >
            {t('extra_module_attached')}
          </StyledText>

          <StyledText as="p" data-testid="UnMatchedModuleWarning_body">
            {`${t('module_mismatch_body')}.`}
          </StyledText>
        </Flex>
      </Banner>
    </Box>
  )
}
