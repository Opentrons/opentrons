import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import { getMainPagePortalEl } from '../Portal'
import styles from './ot2protocolmodal.module.css'

import type { ReactNode } from 'react'

interface Props {
  onClose: () => void
  onOpenOt2Designer: () => void
}

export function Ot2ProtocolModal({
  onClose,
  onOpenOt2Designer,
}: Props): ReactNode {
  const { t } = useTranslation('modal')

  return createPortal(
    <Modal
      type="warning"
      onClose={onClose}
      title={t('redirect_to_ot2_pd.title')}
      footer={
        <div className={styles.modal_container}>
          <SecondaryButton onClick={onClose}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('redirect_to_ot2_pd.cancel')}
            </StyledText>
          </SecondaryButton>
          <PrimaryButton onClick={onOpenOt2Designer}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('redirect_to_ot2_pd.open_ot2_pd')}
            </StyledText>
          </PrimaryButton>
        </div>
      }
    >
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('redirect_to_ot2_pd.body')}
      </StyledText>
    </Modal>,
    getMainPagePortalEl()
  )
}
