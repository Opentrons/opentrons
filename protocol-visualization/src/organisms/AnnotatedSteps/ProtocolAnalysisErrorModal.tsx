import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

import { Modal, PrimaryButton, StyledText } from '@opentrons/components'

import type { ReactNode } from 'react'
import type { AnalysisError } from '@opentrons/shared-data'

interface ProtocolAnalysisErrorModalProps {
  errors: AnalysisError[]
  onClose: () => void
  portalRoot?: HTMLElement | null
}

export function ProtocolAnalysisErrorModal({
  errors,
  onClose,
  portalRoot,
}: ProtocolAnalysisErrorModalProps): ReactNode {
  const { t } = useTranslation('protocol_visualization')
  return createPortal(
    <Modal
      type="error"
      title={t('protocol_analysis_failure')}
      onClose={onClose}
      footer={<PrimaryButton onClick={onClose}>{t('close')}</PrimaryButton>}
    >
      {errors.map(error => (
        <StyledText key={error.id} desktopStyle="bodyDefaultRegular">
          {error.detail}
        </StyledText>
      ))}
      <PrimaryButton
        role="button"
        aria-label="close_analysis_error_modal"
        onClick={onClose}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {i18n.format(t('shared:close'), 'capitalize')}
        </StyledText>
      </PrimaryButton>
    </Modal>,
    portalRoot ?? document.body
  )
}
