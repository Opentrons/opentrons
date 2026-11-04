import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { ModalShell, WizardHeader } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { getIsOnDevice } from '/app/redux/config'

import type { ReactNode } from 'react'

interface ModuleWizardScreenProps {
  isRobotMoving: boolean
  isModuleUpdating: boolean
  handleCleanUpAndClose: () => void
  currentStepIndex: number
  totalStepCount: number
  children: JSX.Element
}

export function ModuleWizardScreen(props: ModuleWizardScreenProps): ReactNode {
  const {
    isRobotMoving,
    isModuleUpdating,
    handleCleanUpAndClose,
    currentStepIndex,
    totalStepCount,
    children,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('module_wizard_flows')

  const wizardHeader = (
    <WizardHeader
      exitDisabled={isRobotMoving || isModuleUpdating}
      title={t('module_setup')}
      currentStep={currentStepIndex}
      totalSteps={totalStepCount}
      onExit={isRobotMoving ? undefined : handleCleanUpAndClose}
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
