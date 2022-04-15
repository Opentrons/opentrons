import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../../../../atoms/text'
import { PrimaryButton, SecondaryButton } from '../../../../../atoms/buttons'
import { Modal } from '../../../../../atoms/Modal'

// click cancel button -> close modal
// click confirm button -> close modal and clear selected data

interface FactoryResetModalProps {
  isRobotConnected: boolean
}

export function FactoryResetModal({
  isRobotConnected,
}: FactoryResetModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <>
      {isRobotConnected ? (
        <Modal title={t('factory_reset_modal_title')} onClose={() => {}}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="p" marginBottom={SPACING.spacing5}>
              {t('factory_reset_modal_description')}
            </StyledText>
            <Flex justifyContent={JUSTIFY_FLEX_END}>
              <SecondaryButton
                onClick={() => {}}
                marginRight={SPACING.spacing3}
              >
                {t('factory_reset_model_cancel_button')}
              </SecondaryButton>
              <PrimaryButton backgroundColor={COLORS.error}>
                {t('factory_reset_modal_confirm_button')}
              </PrimaryButton>
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <Modal
          title={t('factory_reset_modal_connection_lost_title')}
          icon="alert-circle"
          iconColor={COLORS.blue}
          onClose={() => {}}
        >
          <StyledText as="p" marginBottom={SPACING.spacing5}>
            {t('factory_reset_modal_connection_lost_description')}
          </StyledText>
          <Flex justifyContent={JUSTIFY_FLEX_END}>
            <SecondaryButton marginRight={SPACING.spacing3}>
              {t('factory_reset_modal_connection_lost_retry_button')}
            </SecondaryButton>
            <PrimaryButton>
              {t('factory_reset_modal_connection_lost_close_button')}
            </PrimaryButton>
          </Flex>
        </Modal>
      )}
    </>
  )
}
