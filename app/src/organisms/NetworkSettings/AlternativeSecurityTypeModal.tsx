import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface AlternativeSecurityTypeModalProps {
  setShowAlternativeSecurityTypeModal: (
    showAlternativeSecurityTypeModal: boolean
  ) => void
}

export function AlternativeSecurityTypeModal({
  setShowAlternativeSecurityTypeModal,
}: AlternativeSecurityTypeModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const history = useHistory()
  const modalHeader: ModalHeaderBaseProps = {
    title: t('alternative_security_types'),
    hasExitIcon: true,
  }
  const handleCloseModal = (): void => {
    setShowAlternativeSecurityTypeModal(false)
  }
  const handleClick = (): void => {
    setShowAlternativeSecurityTypeModal(false)
    history.push('/network-setup/usb')
  }

  return (
    <Modal
      modalSize="small"
      header={modalHeader}
      onOutsideClick={handleCloseModal}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.darkBlack90}
          >
            {t('alternative_security_types_description')}
          </StyledText>
        </Flex>
        <SmallButton
          buttonType="primary"
          buttonText={t('connect_via', { type: t('usb') })}
          onClick={handleClick}
        />
      </Flex>
    </Modal>
  )
}
