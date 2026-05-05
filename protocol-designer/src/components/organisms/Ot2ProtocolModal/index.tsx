import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import { getOt2DesignerCreateUrl } from '/protocol-designer/utils/getOt2DesignerCreateUrl'

import { getMainPagePortalEl } from '../Portal'
import styles from './ot2protocolmodal.module.css'

interface Props {
  onClose: () => void
}

export function Ot2ProtocolModal({ onClose }: Props): JSX.Element {
  const { t } = useTranslation('modal')

  const handleOpenOt2Designer = (): void => {
    const redirectTarget = getOt2DesignerCreateUrl()
    window.open(redirectTarget, '_blank', 'noopener,noreferrer')
  }

  return createPortal(
    <Modal
      type="warning"
      marginLeft="0"
      onClose={onClose}
      title={t('redirect_to_ot2_pd.title')}
      footer={
        <div className={styles.modal_container}>
          <SecondaryButton onClick={onClose}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('redirect_to_ot2_pd.cancel')}
            </StyledText>
          </SecondaryButton>
          <PrimaryButton onClick={handleOpenOt2Designer}>
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
