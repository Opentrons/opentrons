import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Banner,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
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
  const titleElement = (
    <div className={styles.modal_header}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('select_tips_for_tracking')}
      </StyledText>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('step_counter', { currentStep: currentStepIndex + 1, totalSteps })}
      </StyledText>
    </div>
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
    <Modal
      title={titleElement}
      onClose={onClose}
      width="56.25rem"
      childrenPadding={SPACING.spacing24}
      footer={footerElement}
      stepMeterProps={{ totalSteps, currentStep: currentStepIndex }}
    >
      {children}
    </Modal>,
    getMainPagePortalEl()
  )
}
