import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { TertiaryButton } from '/app/atoms/buttons'
import { RobotCertImportModal } from './RobotCertImportModal'

export function EnterRobotEncryptionKey(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [showRobotCertImportModal, setShowRobotCertImportModal] =
    useState(false)

  return (
    <>
      {showRobotCertImportModal
        ? createPortal(
            <RobotCertImportModal
              onClose={() => {
                setShowRobotCertImportModal(false)
              }}
            />,
            getTopPortalEl()
          )
        : null}
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box width="70%">
          <LegacyStyledText
            css={TYPOGRAPHY.pSemiBold}
            marginBottom={SPACING.spacing4}
            id="AdvancedSettings_robotEncryptionKey"
          >
            {t('robot_encryption_key')}
          </LegacyStyledText>
          <LegacyStyledText forwardedAs="p">
            {t('enter_robot_encryption_key_description')}
          </LegacyStyledText>
        </Box>
        <TertiaryButton
          marginLeft={SPACING_AUTO}
          onClick={() => {
            setShowRobotCertImportModal(true)
          }}
          id="RobotSettings_EnterEncryptionKeyButton"
        >
          {t('enter_encryption_key')}
        </TertiaryButton>
      </Flex>
    </>
  )
}
