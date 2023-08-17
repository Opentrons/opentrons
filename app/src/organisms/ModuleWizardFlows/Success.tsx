import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { getModuleDisplayName } from '@opentrons/shared-data'
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

export const Success = (
  props: ModuleCalibrationWizardStepProps
): JSX.Element | null => {
  const { proceed, attachedModule, isRobotMoving } = props
  const { t } = useTranslation('module_wizard_flows')
  const moduleDisplayName = getModuleDisplayName(attachedModule.moduleModel)

  const handleOnClick = (): void => {
    proceed()
  }

  return (
    <SimpleWizardBody
      header={t('successfully_calibrated', { module: moduleDisplayName })}
      // TODO: iconColor unused, change SimpleWizardBody props interface
      iconColor={COLORS.errorEnabled}
      isSuccess
    >
      <PrimaryButton disabled={isRobotMoving} onClick={handleOnClick}>
        {t('exit')}
      </PrimaryButton>
    </SimpleWizardBody>
  )
}
