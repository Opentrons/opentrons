import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '../../../../atoms/buttons'
import {
  NON_SANCTIONED_RECOVERY_COLOR_STYLE_PRIMARY,
  NON_SANCTIONED_RECOVERY_COLOR_STYLE_SECONDARY,
} from '../../constants'

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
          buttonType="secondary"
          flex="1"
          css={NON_SANCTIONED_RECOVERY_COLOR_STYLE_SECONDARY}
          buttonText={t('go_back')}
          justifyContent={JUSTIFY_CENTER}
          onClick={secondaryBtnOnClick}
          marginTop="auto"
        />
        <SmallButton
          buttonType="primary"
          flex="1"
          css={NON_SANCTIONED_RECOVERY_COLOR_STYLE_PRIMARY}
          buttonText={primaryBtnTextOverride ?? t('continue')}
          justifyContent={JUSTIFY_CENTER}
          onClick={primaryBtnOnClick}
          marginTop="auto"
        />
      </Flex>
    )
  } else {
    return null
  }
}
