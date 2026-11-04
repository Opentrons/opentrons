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
  showErrorBanner: boolean
  numPickupsRemaining: number
  showReusingTipsBanner: boolean
  showNoAvailableTipracksBanner: boolean
  showSelectedTiprackNotValidBanner: boolean
  errorReason: TipSelectionBannerReason | null
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
    showErrorBanner,
    numPickupsRemaining,
    showReusingTipsBanner,
    showNoAvailableTipracksBanner,
    showSelectedTiprackNotValidBanner,
    errorReason,
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
      {errorReason != null && showErrorBanner && currentStepIndex === 1 ? (
        <InlineNotification
          type="error"
          message={t(
            `error_banner.${errorReason}`,
            errorReason === 'pickupsRequired'
              ? { count: numPickupsRemaining }
              : {}
          )}
          hug
        />
      ) : null}
      {showNoAvailableTipracksBanner && currentStepIndex === 0 ? (
        <InlineNotification
          type="error"
          heading={t('no_valid_tips_available.title')}
          message={t('no_valid_tips_available.body')}
          hug
        />
      ) : null}
      {!showNoAvailableTipracksBanner &&
      showSelectedTiprackNotValidBanner &&
      currentStepIndex === 0 ? (
        <InlineNotification
          type="alert"
          heading={t('selected_tiprack_not_valid.title')}
          message={t('selected_tiprack_not_valid.body')}
          hug
        />
      ) : null}
      {(errorReason == null || !showErrorBanner) &&
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
      <div className={styles.modal_footer_continue}>
        <PrimaryButton onClick={onContinue}>{continueText}</PrimaryButton>
      </div>
    </div>
  )

  return createPortal(
    <ModalShell header={header} width="56.25rem" footer={footerElement}>
      <Box padding={SPACING.spacing24}>{children}</Box>
    </ModalShell>,
    getMainPagePortalEl()
  )
}
