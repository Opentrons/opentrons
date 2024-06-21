import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_START,
  Btn,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Banner } from '../../../atoms/Banner'

export function ProtocolDropTipBanner(props: {
  onLaunchWizardClick: (setShowWizard: true) => void
  onCloseClick: () => void
}): JSX.Element {
  const { t } = useTranslation('drop_tip_wizard')
  const { onLaunchWizardClick, onCloseClick } = props

  return (
    <Banner
      type="warning"
      onCloseClick={onCloseClick}
      marginBottom={SPACING.spacing16}
      paddingRight={SPACING.spacing16}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('tips_may_be_attached')}
        </LegacyStyledText>

        <Flex flexDirection={DIRECTION_ROW}>
          <LegacyStyledText as="p" marginRight={SPACING.spacing4}>
            {t('remove_the_tips_from_pipette')}
          </LegacyStyledText>
          <Btn
            textAlign={ALIGN_START}
            onClick={() => {
              onLaunchWizardClick(true)
            }}
            aria-label="remove-tips"
          >
            <LegacyStyledText
              as="p"
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
            >
              {t('remove_tips')}
            </LegacyStyledText>
          </Btn>
        </Flex>
      </Flex>
    </Banner>
  )
}
