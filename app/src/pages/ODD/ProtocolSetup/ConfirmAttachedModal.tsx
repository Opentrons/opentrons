import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface ConfirmAttachedModalProps {
  onCloseClick: () => void
  isProceedToRunModal: boolean
  onConfirmClick: () => void
}

export function ConfirmAttachedModal({
  onCloseClick,
  isProceedToRunModal,
  onConfirmClick,
}: ConfirmAttachedModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['protocol_setup', 'shared'])
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('confirm_heater_shaker_module_modal_title'),
    hasExitIcon: true,
  }

  const handleProceedToRun = (): void => {
    onConfirmClick()
    onCloseClick()
  }

  return (
    <OddModal header={modalHeader} onOutsideClick={onCloseClick}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <LegacyStyledText as="p">
          {t('confirm_heater_shaker_module_modal_description')}
        </LegacyStyledText>
        <Flex gridGap={SPACING.spacing8}>
          <SmallButton
            flex="1"
            buttonType="secondary"
            buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
            onClick={() => {
              onCloseClick()
            }}
          />
          <SmallButton
            flex="1"
            buttonType="primary"
            buttonText={t('proceed_to_run')}
            onClick={handleProceedToRun}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
