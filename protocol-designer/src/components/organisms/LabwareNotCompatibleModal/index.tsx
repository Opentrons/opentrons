import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getMainPagePortalEl } from '../Portal'

interface LabwareNotCompatibleModalProps {
  onDone: () => void
  onClose: () => void
  labwareDisplayName: string
}
export function LabwareNotCompatibleModal(
  props: LabwareNotCompatibleModalProps
): JSX.Element | null {
  const { onDone, onClose, labwareDisplayName } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])

  return createPortal(
    <Modal
      type="warning"
      title={t('delete_labware')}
      onClose={onClose}
      footer={
        <Flex
          padding={SPACING.spacing24}
          justifyContent={JUSTIFY_END}
          gridGap={SPACING.spacing8}
        >
          <SecondaryButton onClick={onClose}>
            {t('shared:cancel')}
          </SecondaryButton>
          <PrimaryButton onClick={onDone}>{t('delete_labware')}</PrimaryButton>
        </Flex>
      }
    >
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('this_adapter_is_required', { name: labwareDisplayName })}{' '}
      </StyledText>
    </Modal>,
    getMainPagePortalEl()
  )
}
