import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  RESPONSIVENESS,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

import type { ModuleSetupWizardStepProps } from './types'

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export const Success = (
  props: ModuleSetupWizardStepProps
): JSX.Element | null => {
  const { proceed, attachedModule, isRobotMoving, isOnDevice } = props
  const { t } = useTranslation('module_wizard_flows')
  const moduleDisplayName = getModuleDisplayName(attachedModule.moduleModel)

  const handleOnClick = (): void => {
    proceed()
  }
  const button = isOnDevice ? (
    <SmallButton onClick={handleOnClick} buttonText={t('exit')} />
  ) : (
    <PrimaryButton disabled={isRobotMoving} onClick={handleOnClick}>
      {t('exit')}
    </PrimaryButton>
  )

  return (
    <SimpleWizardBody
      header={t('successfully_setup', { module: moduleDisplayName })}
      iconColor={COLORS.red50}
      isSuccess
      justifyContentForOddButton={JUSTIFY_FLEX_END}
    >
      {button}
    </SimpleWizardBody>
  )
}
