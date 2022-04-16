import * as React from 'react'
import { useDispatch } from 'react-redux'
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
import { useDispatchApiRequest } from '../../../../../redux/robot-api'
import { resetConfig } from '../../../../../redux/robot-admin'
import { connect } from '../../../../../redux/robot'

import type { Dispatch } from '../../../../../redux/types'
import type { ResetConfigRequest } from '../../../../../redux/robot-admin/types'
// click cancel button -> close modal
// click confirm button -> close modal and clear selected data

interface FactoryResetModalProps {
  isRobotConnected: boolean
  robotName: string
  resetOptions?: ResetConfigRequest
}

export function FactoryResetModal({
  isRobotConnected,
  robotName,
  resetOptions,
}: FactoryResetModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [dispatchRequest] = useDispatchApiRequest()
  const dispatch = useDispatch<Dispatch>()

  const triggerReset = (): unknown => {
    if (resetOptions) dispatchRequest(resetConfig(robotName, resetOptions))
  }

  const connectRobot = (): unknown => {
    dispatch(connect(robotName))
  }

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
              <PrimaryButton
                backgroundColor={COLORS.error}
                onClick={triggerReset}
              >
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
            <SecondaryButton
              marginRight={SPACING.spacing3}
              onClick={connectRobot}
            >
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
