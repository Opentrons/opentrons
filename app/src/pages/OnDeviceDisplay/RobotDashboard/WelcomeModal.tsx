import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Flex,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { SmallButton } from '../../../atoms/buttons'
import { Modal } from '../../../molecules/Modal/OnDeviceDisplay'
import { updateConfigValue } from '../../../redux/config'

import welcomeModalImage from '../../../assets/images/on-device-display/welcome_dashboard_modal.png'

import type { Dispatch } from '../../../redux/types'

interface WelcomeModalProps {
  setShowWelcomeModal: (showWelcomeModal: boolean) => void
}

export function WelcomedModal({
  setShowWelcomeModal,
}: WelcomeModalProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const dispatch = useDispatch<Dispatch>()

  const handleCloseModal = (): void => {
    dispatch(
      updateConfigValue(
        'onDeviceDisplaySettings.unfinishedUnboxingFlowRoute',
        null
      )
    )
    setShowWelcomeModal(false)
  }

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
            color={COLORS.darkBlack90}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('welcome_modal_description')}
          </StyledText>
        </Flex>
        <SmallButton
          buttonType="primary"
          buttonText={t('got_it')}
          onClick={handleCloseModal}
        />
      </Flex>
    </Modal>
  )
}
