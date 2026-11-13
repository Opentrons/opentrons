import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import type { ReactNode } from 'react'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface DeckConfigurationDiscardChangesModalProps {
  setShowConfirmationModal: (showConfirmationModal: boolean) => void
}

export function DeckConfigurationDiscardChangesModal({
  setShowConfirmationModal,
}: DeckConfigurationDiscardChangesModalProps): ReactNode {
  const { t } = useTranslation('device_details')
  const navigate = useNavigate()
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('changes_will_be_lost'),
  }

  const handleDiscard = (): void => {
    setShowConfirmationModal(false)
    navigate(-1)
  }

  return (
    <OddModal header={modalHeader}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <LegacyStyledText forwardedAs="p">
          {t('changes_will_be_lost_description')}
        </LegacyStyledText>
        <Flex
          width="100%"
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
        >
          <SmallButton
            width="100%"
            buttonType="alert"
            buttonText={t('discard_changes')}
            onClick={handleDiscard}
          />
          <SmallButton
            width="100%"
            buttonText={t('continue_editing')}
            onClick={() => {
              setShowConfirmationModal(false)
            }}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
