import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import { getMainPagePortalEl } from '../Portal'
import styles from './flexprotocolmodal.module.css'

interface Props {
  onClose: () => void
  onOpenFlexDesigner: () => void
}

export function FlexProtocolModal({
  onClose,
  onOpenFlexDesigner,
}: Props): JSX.Element {
  const { t } = useTranslation('modal')

  return createPortal(
    <Modal
      type="warning"
      marginLeft="0"
      onClose={onClose}
      title={t('redirect_to_flex_pd.title')}
      footer={
        <div className={styles.modal_container}>
          <SecondaryButton onClick={onClose}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('redirect_to_flex_pd.cancel')}
            </StyledText>
          </SecondaryButton>
          <PrimaryButton onClick={onOpenFlexDesigner}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('redirect_to_flex_pd.open_flex_pd')}
            </StyledText>
          </PrimaryButton>
        </div>
      }
    >
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('redirect_to_flex_pd.body')}
      </StyledText>
    </Modal>,
    getMainPagePortalEl()
  )
}
