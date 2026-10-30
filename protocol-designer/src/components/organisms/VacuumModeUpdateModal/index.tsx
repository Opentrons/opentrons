import { useTranslation } from 'react-i18next'

import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import styles from './vacuummodeupdatemodal.module.css'

import type { ReactNode } from 'react'

interface VacuumModeUpdateModalProps {
  onConfirm: () => void
  onClose: () => void
}

export function VacuumModeUpdateModal(
  props: VacuumModeUpdateModalProps
): ReactNode {
  const { onConfirm, onClose } = props
  const { t } = useTranslation(['modal', 'shared'])

  const footer = (
    <div className={styles.footer}>
      <SecondaryButton onClick={onClose}>{t('shared:cancel')}</SecondaryButton>
      <PrimaryButton onClick={onConfirm}>{t('shared:confirm')}</PrimaryButton>
    </div>
  )
  return (
    <Modal
      onClose={onClose}
      title={t('vacuum_mode_update.title')}
      footer={footer}
      type="warning"
    >
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('vacuum_mode_update.body')}
      </StyledText>
    </Modal>
  )
}
