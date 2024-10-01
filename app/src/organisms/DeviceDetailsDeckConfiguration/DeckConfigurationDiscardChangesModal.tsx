import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface DeckConfigurationDiscardChangesModalProps {
  setShowConfirmationModal: (showConfirmationModal: boolean) => void
}

export function DeckConfigurationDiscardChangesModal({
  setShowConfirmationModal,
}: DeckConfigurationDiscardChangesModalProps): JSX.Element {
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
        <LegacyStyledText as="p">
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
