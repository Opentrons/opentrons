import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  SPACING,
  Btn,
  TYPOGRAPHY,
  ALIGN_START,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
} from '@opentrons/components'

import { Banner } from '../../../atoms/Banner'
import { StyledText } from '../../../atoms/text'

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
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('tips_may_be_attached')}
        </StyledText>

        <Flex flexDirection={DIRECTION_ROW}>
          <StyledText as="p" marginRight={SPACING.spacing4}>
            {t('remove_the_tips_from_pipette')}
          </StyledText>
          <Btn
            textAlign={ALIGN_START}
            onClick={() => onLaunchWizardClick(true)}
            aria-label="remove-tips"
          >
            <StyledText
              as="p"
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
            >
              {t('remove_tips')}
            </StyledText>
          </Btn>
        </Flex>
      </Flex>
    </Banner>
  )
}
