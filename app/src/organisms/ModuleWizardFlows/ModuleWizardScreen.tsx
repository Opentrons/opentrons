import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { ModalShell, WizardHeader } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { getWizardHeaderExit } from '/app/components/adhoc/shared/wizards/getWizardHeaderExit'
import { getIsOnDevice } from '/app/redux/config'

import type { ReactNode } from 'react'

interface ModuleWizardScreenProps {
  isRobotMoving: boolean
  isModuleUpdating: boolean
  handleCleanUpAndClose: () => void
  handleCloseWithoutHome?: () => void
  isError?: boolean
  currentStepIndex: number
  totalStepCount: number
  children: JSX.Element
}

export function ModuleWizardScreen(props: ModuleWizardScreenProps): ReactNode {
  const {
    isRobotMoving,
    isModuleUpdating,
    handleCleanUpAndClose,
    handleCloseWithoutHome,
    isError = false,
    currentStepIndex,
    totalStepCount,
    children,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('module_wizard_flows')
  const { onExit, exitDisabled } = getWizardHeaderExit({
    isError,
    isBusy: isRobotMoving || isModuleUpdating,
    onExitError: handleCloseWithoutHome ?? handleCleanUpAndClose,
    onExitIdle: handleCleanUpAndClose,
  })

  const wizardHeader = (
    <WizardHeader
      exitDisabled={exitDisabled}
      title={t('module_setup')}
      currentStep={currentStepIndex}
      totalSteps={totalStepCount}
      onExit={onExit}
      hideStepText
    />
  )

  return createPortal(
    isOnDevice ? (
      <ModalShell>
        {wizardHeader}
        {children}
      </ModalShell>
    ) : (
      <ModalShell width="47rem" height="auto" header={wizardHeader}>
        {children}
      </ModalShell>
    ),
    getTopPortalEl()
  )
}
