import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface AlternativeSecurityTypeModalProps {
  setShowAlternativeSecurityTypeModal: (
    showAlternativeSecurityTypeModal: boolean
  ) => void
}

export function AlternativeSecurityTypeModal({
  setShowAlternativeSecurityTypeModal,
}: AlternativeSecurityTypeModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'branded'])
  const navigate = useNavigate()
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('alternative_security_types'),
    hasExitIcon: true,
  }
  const handleCloseModal = (): void => {
    setShowAlternativeSecurityTypeModal(false)
  }
  const handleClick = (): void => {
    setShowAlternativeSecurityTypeModal(false)
    navigate('/network-setup/usb')
  }

  return (
    <OddModal
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
          <LegacyStyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.grey60}
          >
            {t('branded:alternative_security_types_description')}
          </LegacyStyledText>
        </Flex>
        <SmallButton
          buttonText={t('connect_via', { type: t('usb') })}
          onClick={handleClick}
        />
      </Flex>
    </OddModal>
  )
}
