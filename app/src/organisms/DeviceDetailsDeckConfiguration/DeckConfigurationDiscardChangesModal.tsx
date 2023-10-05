import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'

import { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface DeckConfigurationDiscardChangesModalProps {
  setShowConfirmationModal: (showConfirmationModal: boolean) => void
}

export function DeckConfigurationDiscardChangesModal({
  setShowConfirmationModal,
}: DeckConfigurationDiscardChangesModalProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const modalHeader: ModalHeaderBaseProps = {
    title: t('changes_will_be_lost'),
  }

  const handleDiscard = (): void => {
    // ToDo (kk: 09/29/2023) discard deck configuration changes
    setShowConfirmationModal(false)
    // close the modal and then back the previous screen
  }

  return (
    <Modal header={modalHeader}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <StyledText as="p">{t('changes_will_be_lost_description')}</StyledText>
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
            onClick={() => setShowConfirmationModal(false)}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
