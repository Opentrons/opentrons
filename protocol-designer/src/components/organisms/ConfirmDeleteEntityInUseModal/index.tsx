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

import { HandleEnter } from '/protocol-designer/components/atoms'

import { getMainPagePortalEl } from '../Portal'

import type { ReactNode } from 'react'

interface ConfirmDeleteEntityInUseModalProps {
  onClose: () => void
  onConfirm: () => void
}
export function ConfirmDeleteEntityInUseModal(
  props: ConfirmDeleteEntityInUseModalProps
): ReactNode {
  const { onClose, onConfirm } = props
  const { t } = useTranslation(['onboarding', 'shared'])

  return createPortal(
    <HandleEnter onEnter={onConfirm}>
      <Modal
        zIndexOverlay={11}
        title={t(`are_you_sure_clear_slot`)}
        type="warning"
        onClose={onClose}
        footer={
          <Flex
            justifyContent={JUSTIFY_END}
            gridGap={SPACING.spacing8}
            padding={`0 ${SPACING.spacing24} ${SPACING.spacing24} ${SPACING.spacing24}`}
          >
            <SecondaryButton
              onClick={() => {
                onClose()
              }}
            >
              {t('shared:cancel')}
            </SecondaryButton>
            <PrimaryButton onClick={onConfirm}>{t('clear_slot')}</PrimaryButton>
          </Flex>
        }
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('slot_contains_used_entities')}
        </StyledText>
      </Modal>
    </HandleEnter>,
    getMainPagePortalEl()
  )
}
