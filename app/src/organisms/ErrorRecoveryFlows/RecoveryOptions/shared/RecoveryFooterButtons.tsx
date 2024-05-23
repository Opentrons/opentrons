import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '../../../../atoms/buttons'

interface RecoveryOptionProps {
  isOnDevice: boolean
  secondaryBtnOnClick: () => void
  primaryBtnOnClick: () => void
  primaryBtnTextOverride?: string
}
export function RecoveryFooterButtons({
  isOnDevice,
  secondaryBtnOnClick,
  primaryBtnOnClick,
  primaryBtnTextOverride,
}: RecoveryOptionProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')

  if (isOnDevice) {
    return (
      <Flex
        width="100%"
        height="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
      >
        <SmallButton
          buttonType="tertiaryLowLight"
          buttonText={t('go_back')}
          onClick={secondaryBtnOnClick}
          marginTop="auto"
        />
        <SmallButton
          buttonType="primary"
          buttonText={primaryBtnTextOverride ?? t('continue')}
          onClick={primaryBtnOnClick}
          marginTop="auto"
        />
      </Flex>
    )
  } else {
    return null
  }
}
