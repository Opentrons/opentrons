import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getMainPagePortalEl } from '../Portal'
import { useConfirmationContent } from './useConfirmationContent'

import type { ReactNode } from 'react'
import type { FormData } from '/protocol-designer/form-types'

interface AdvancedSettingsUpdateConfirmationModalProps {
  formData: FormData
  fieldsChangedRequiringConfirmation: string[]
  onKeepExistingSettings: () => void
  onConfirmUpdateSettings: () => void
  onClose: () => void
}

export function AdvancedSettingsUpdateConfirmationModal(
  props: AdvancedSettingsUpdateConfirmationModalProps
): ReactNode {
  const {
    formData,
    fieldsChangedRequiringConfirmation,
    onKeepExistingSettings,
    onConfirmUpdateSettings,
    onClose,
  } = props
  const { t } = useTranslation('form')
  const { title, body } = useConfirmationContent(
    fieldsChangedRequiringConfirmation,
    formData.liquidClass as string,
    formData.stepType
  )
  return createPortal(
    <Modal
      title={title}
      titleElement1={
        <Icon name="ot-alert" size="1.25rem" color={COLORS.yellow50} />
      }
      closeOnOutsideClick
      onClose={onClose}
      footer={
        <Flex
          gridGap={SPACING.spacing8}
          justifyContent={JUSTIFY_FLEX_END}
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
        >
          <SecondaryButton onClick={onKeepExistingSettings}>
            {t('field_update_confirmation_modal.footer.use_current_settings')}
          </SecondaryButton>
          <PrimaryButton onClick={onConfirmUpdateSettings}>
            {t('field_update_confirmation_modal.footer.update_settings')}
          </PrimaryButton>
        </Flex>
      }
    >
      <StyledText desktopStyle="bodyDefaultRegular">{body}</StyledText>
    </Modal>,
    getMainPagePortalEl()
  )
}
