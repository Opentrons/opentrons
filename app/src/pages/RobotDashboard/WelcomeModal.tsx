import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'

import welcomeModalImage from '../../assets/images/on-device-display/welcome_dashboard_modal.png'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data'

interface WelcomeModalProps {
  setShowAnalyticsOptInModal: (showAnalyticsOptInModal: boolean) => void
  setShowWelcomeModal: (showWelcomeModal: boolean) => void
}

export function WelcomeModal({
  setShowAnalyticsOptInModal,
  setShowWelcomeModal,
}: WelcomeModalProps): JSX.Element {
  const { t } = useTranslation(['device_details', 'shared'])

  const { createLiveCommand } = useCreateLiveCommandMutation()
  const animationCommand: SetStatusBarCreateCommand = {
    commandType: 'setStatusBar',
    params: { animation: 'disco' },
  }

  const startDiscoAnimation = (): void => {
    createLiveCommand({
      command: animationCommand,
      waitUntilComplete: false,
    }).catch((e: Error) =>
      console.warn(`cannot run status bar animation: ${e.message}`)
    )
  }

  const handleCloseModal = (): void => {
    setShowWelcomeModal(false)
    setShowAnalyticsOptInModal(true)
  }

  React.useEffect(startDiscoAnimation, [])

  return (
    <Modal modalSize="small" onOutsideClick={handleCloseModal}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <img
            src={welcomeModalImage}
            alt="Welcome Modal Main image"
            width="454px"
            height="128px"
          />
          <StyledText
            as="h4"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('welcome_to_your_dashboard')}
          </StyledText>
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.grey60}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('welcome_modal_description')}
          </StyledText>
        </Flex>
        <SmallButton buttonText={t('shared:next')} onClick={handleCloseModal} />
      </Flex>
    </Modal>
  )
}
