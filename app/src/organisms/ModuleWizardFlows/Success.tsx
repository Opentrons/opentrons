import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  RESPONSIVENESS,
  SecondaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { useGetNewModules } from '/app/App/hooks'
import { SmallButton } from '/app/atoms/buttons'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

import { useSendIdentifyModule } from './hooks'

import type { AttachedModule } from '@opentrons/api-client'
import type { ModuleSetupWizardStepProps } from './types'

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

interface SuccessProps extends ModuleSetupWizardStepProps {
  setSelectedModule: (module: AttachedModule | null) => void
  attachedModuleOnLaunch?: AttachedModule | null
}

export const Success = (props: SuccessProps): JSX.Element | null => {
  const {
    proceed,
    attachedModule,
    attachedModuleOnLaunch = null,
    isRobotMoving,
    isOnDevice,
    restartSetup,
    setSelectedModule,
  } = props
  const { t } = useTranslation('module_wizard_flows')
  const sendIdentifyModule = useSendIdentifyModule()
  const moduleDisplayName = getModuleDisplayName(attachedModule.moduleModel)
  const newModules = useGetNewModules()

  const handleOnClick = (restart: boolean): void => {
    if (restart) {
      setSelectedModule(null)
      sendIdentifyModule(attachedModule, false)
      restartSetup()
      return
    }
    proceed()
  }

  const finishButton = isOnDevice ? (
    <SmallButton
      buttonType="primary"
      onClick={() => {
        handleOnClick(false)
      }}
      buttonText={t('finish')}
    />
  ) : (
    <PrimaryButton
      disabled={isRobotMoving}
      onClick={() => {
        handleOnClick(false)
      }}
    >
      {t('finish')}
    </PrimaryButton>
  )

  const setupAnotherButton = isOnDevice ? (
    <SmallButton
      buttonType="secondary"
      onClick={() => {
        handleOnClick(true)
      }}
      buttonText={t('setup_another_module')}
    />
  ) : (
    <SecondaryButton
      disabled={isRobotMoving}
      onClick={() => {
        handleOnClick(true)
      }}
    >
      {t('setup_another_module')}
    </SecondaryButton>
  )

  return (
    <SimpleWizardBody
      justifyContentForOddButton={JUSTIFY_FLEX_END}
      isSuccess={true}
      iconColor={COLORS.red50}
      header={t('successfully_setup', { module: moduleDisplayName })}
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
        {newModules.length > 0 && attachedModuleOnLaunch == null
          ? setupAnotherButton
          : null}
        {finishButton}
      </Flex>
    </SimpleWizardBody>
  )
}
