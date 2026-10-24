import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { CopyButton } from '../../molecules/CopyButton'

import {
  CodeBlock,
  Modal,
  PrimaryButton,
  StyledText,
  Z_INDEX,
} from '@opentrons/components'

import styles from './protocolanalysiserrormodal.module.css'

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
  const { t } = useTranslation(['protocol_visualization'])
  return createPortal(
    <Modal
      type="error"
      title={t('protocol_analysis_failure')}
      onClose={onClose}
      zIndexOverlay={Z_INDEX.MODALS}
    >
      <div className={styles.container}>
        {errors.map(error => (
          <div key={error.id} className={styles.code_block_container}>
            <CopyButton
              value={error.detail}
              aria-label={t('copy_error')}
              className={styles.copy_button}
            />
            <CodeBlock>{error.detail}</CodeBlock>
          </div>
        ))}
        <div className={styles.button_container}>
          <PrimaryButton role="button" onClick={onClose}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('close')}
            </StyledText>
          </PrimaryButton>
        </div>
      </div>
    </Modal>,
    portalRoot ?? document.body
  )
}
