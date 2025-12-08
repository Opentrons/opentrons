import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Box,
  InlineNotification,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  WizardHeader,
} from '@opentrons/components'

import { getMainPagePortalEl } from '/protocol-designer/components/organisms/Portal'

import styles from './tipselectionwizard.module.css'

import type { ReactNode } from 'react'
import type { TipSelectionBannerReason } from './types'

interface TipSelectionModalProps {
  onClose: () => void
  onBack: () => void
  onContinue: () => void
  children: ReactNode
  currentStepIndex: number
  totalSteps: number
  showBackButton?: boolean
  continueText?: string
  errorBannerReason: TipSelectionBannerReason | null
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
    errorBannerReason,
    numPickupsRemaining,
    showReusingTipsBanner,
  } = props
  const { t } = useTranslation('tip_selection')

  const header = (
    <WizardHeader
      title={t('select_tips_for_tracking')}
      currentStep={currentStepIndex + 1}
      totalSteps={totalSteps}
      onExit={onClose}
    />
  )

  const footerElement = (
    <div className={styles.modal_footer}>
      {errorBannerReason != null ? (
        <InlineNotification
          type="error"
          message={t(
            `error_banner.${errorBannerReason}`,
            errorBannerReason === 'pickupsRequired'
              ? { count: numPickupsRemaining }
              : {}
          )}
          hug
        />
      ) : null}
      {errorBannerReason == null &&
      showReusingTipsBanner &&
      currentStepIndex === 1 ? (
        <InlineNotification
          type="alert"
          message={t('reusing_tips_banner')}
          hug
        />
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
