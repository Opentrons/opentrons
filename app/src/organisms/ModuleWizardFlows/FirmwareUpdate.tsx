import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  PrimaryButton,
  RESPONSIVENESS,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'

import type { ModuleCalibrationWizardStepProps } from './types'

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export const FirmwareUpdate = (
  props: ModuleCalibrationWizardStepProps
): JSX.Element | null => {
  const { proceed } = props
  const { t } = useTranslation('module_wizard_flows')
  const handleOnClick = (): void => {
    proceed()
  }

  return (
    <SimpleWizardBody
      header={'TODO: FIRMWARE UPDATE'}
      iconColor={COLORS.errorEnabled}
      isSuccess
    >
      <PrimaryButton onClick={handleOnClick}>{t('next')}</PrimaryButton>
    </SimpleWizardBody>
  )
}
