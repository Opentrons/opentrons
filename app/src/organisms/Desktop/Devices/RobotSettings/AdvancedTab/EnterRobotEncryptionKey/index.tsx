import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { SPACING, StyledText, TYPOGRAPHY } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { TertiaryButton } from '/app/atoms/buttons'
import { RobotCertImportModal } from '/app/organisms/Desktop/RobotCertImport/RobotCertImportModal'

import styles from './index.module.css'

import type { ReactNode } from 'react'

export function EnterRobotEncryptionKey(): ReactNode {
  const { t } = useTranslation('device_settings')
  const [showModal, setShowRobotCertImportModal] = useState(false)

  return (
    <>
      {showModal
        ? createPortal(
            <RobotCertImportModal
              onClose={() => {
                setShowRobotCertImportModal(false)
              }}
            />,
            getTopPortalEl()
          )
        : null}
      <div className={styles.container}>
        <div className={styles.text_container}>
          <StyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginBottom={SPACING.spacing4}
          >
            {t('encryption_key_title')}
          </StyledText>
          <StyledText forwardedAs="p">
            {t('encryption_key_description')}
          </StyledText>
        </div>
        <TertiaryButton
          onClick={() => {
            setShowRobotCertImportModal(true)
          }}
        >
          {t('encryption_key_button')}
        </TertiaryButton>
      </div>
    </>
  )
}
