import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Banner,
  Box,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  WizardHeader,
} from '@opentrons/components'

import { getMainPagePortalEl } from '/protocol-designer/components/organisms/Portal'

import styles from './tipselectionwizard.module.css'

import type { ReactNode } from 'react'

interface TipSelectionModalProps {
  onClose: () => void
  onBack: () => void
  onContinue: () => void
  children: ReactNode
  currentStepIndex: number
  totalSteps: number
  showBackButton?: boolean
  continueText?: string
  showPickupsRequiredBanner: boolean
  numPickupsRemaining: number
  showReusingTipsBanner: boolean
}

export function TipSelectionModal(props: TipSelectionModalProps): JSX.Element {
  const {
    onClose,
    onBack,
    onContinue,
    children,
    showBackButton,
    continueText,
    currentStepIndex,
    totalSteps,
    showPickupsRequiredBanner,
    numPickupsRemaining,
    showReusingTipsBanner,
  } = props
  const { t } = useTranslation('tip_selection')

  const header = (
    <WizardHeader
      title={t('select_tips_for_tracking')}
      currentStep={currentStepIndex}
      totalSteps={totalSteps}
      onExit={onClose}
    />
  )

  const footerElement = (
    <div className={styles.modal_footer}>
      {showPickupsRequiredBanner ? (
        <Banner type="error">
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('not_enough_tips_selected', { count: numPickupsRemaining })}
          </StyledText>
        </Banner>
      ) : null}
      {/* pickups required error takes precedence over reusing tips warning */}
      {showReusingTipsBanner && !showPickupsRequiredBanner ? (
        <Banner type="warning">
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('reusing_tips_banner')}
          </StyledText>
        </Banner>
      ) : null}
      {showBackButton ? (
        <SecondaryButton onClick={onBack}>{t('go_back')}</SecondaryButton>
      ) : null}
      <PrimaryButton onClick={onContinue}>{continueText}</PrimaryButton>
    </div>
  )

  return createPortal(
    <ModalShell header={header} width="56.25rem" footer={footerElement}>
      <Box padding={SPACING.spacing24}>{children}</Box>
    </ModalShell>,
    getMainPagePortalEl()
  )
}
