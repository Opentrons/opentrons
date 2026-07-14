import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import welcomeModalImage from '/app/assets/images/on-device-display/welcome_dashboard_modal.png'
import { SmallButton } from '/app/atoms/buttons'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { OddModal } from '/app/molecules/OddModal'
import { updateConfigValue } from '/app/redux/config'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data'
import type { Dispatch } from '/app/redux/types'

interface WelcomeModalProps {
  setShowWelcomeModal: (showWelcomeModal: boolean) => void
}

export function WelcomeModal({
  setShowWelcomeModal,
}: WelcomeModalProps): JSX.Element {
  const { t } = useTranslation(['device_details', 'shared'])
  const dispatch = useDispatch<Dispatch>()

  // setStatusBar does not require documentation, as it's not a user action.
  const { createLiveCommand } = useCreateLiveCommandMutation(
    ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
  )
  const animationCommand: SetStatusBarCreateCommand = {
    commandType: 'setStatusBar',
    params: { animation: 'disco' },
  }

  const startDiscoAnimation = (): void => {
    createLiveCommand({
      command: animationCommand,
      waitUntilComplete: false,
    }).catch((e: Error) => {
      console.warn(`cannot run status bar animation: ${e.message}`)
    })
  }

  const handleCloseModal = (): void => {
    dispatch(
      updateConfigValue(
        'onDeviceDisplaySettings.unfinishedUnboxingFlowRoute',
        null
      )
    )
    setShowWelcomeModal(false)
  }

  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(startDiscoAnimation, [])

  return (
    <OddModal modalSize="small" onOutsideClick={handleCloseModal}>
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
          <LegacyStyledText
            forwardedAs="h4"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('welcome_to_your_dashboard')}
          </LegacyStyledText>
          <LegacyStyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.grey60}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('welcome_modal_description')}
          </LegacyStyledText>
        </Flex>
        <SmallButton buttonText={t('shared:next')} onClick={handleCloseModal} />
      </Flex>
    </OddModal>
  )
}
