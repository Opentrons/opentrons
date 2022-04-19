import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import last from 'lodash/last'
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
import {
  useDispatchApiRequest,
  getRequestById,
  SUCCESS,
  PENDING,
} from '../../../../../redux/robot-api'
import { resetConfig } from '../../../../../redux/robot-admin'
import { connect } from '../../../../../redux/robot'

import type { IconProps } from '@opentrons/components'
import type { State, Dispatch } from '../../../../../redux/types'
import type { ResetConfigRequest } from '../../../../../redux/robot-admin/types'

interface FactoryResetModalProps {
  closeModal: () => void
  isRobotConnected: boolean
  robotName: string
  resetOptions?: ResetConfigRequest
}

export function FactoryResetModal({
  closeModal,
  isRobotConnected,
  robotName,
  resetOptions,
}: FactoryResetModalProps): JSX.Element {
  const reconnectModalIcon: IconProps = {
    name: 'alert-circle',
    color: COLORS.blue,
  }
  const { t } = useTranslation('device_settings')
  const [dispatchRequest, requestIds] = useDispatchApiRequest()
  const dispatch = useDispatch<Dispatch>()
  const resetRequestStatus = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? getRequestById(state, lastId) : null
  })?.status

  const triggerReset = (): void => {
    if (resetOptions) dispatchRequest(resetConfig(robotName, resetOptions))
  }

  const connectRobot = (): void => {
    dispatch(connect(robotName))
  }

  React.useEffect(() => {
    if (resetRequestStatus === SUCCESS) closeModal()
  }, [resetRequestStatus, closeModal])

  const PENDING_STATUS = resetRequestStatus === PENDING

  return (
    <>
      {isRobotConnected ? (
        <Modal title={t('factory_reset_modal_title')} onClose={closeModal}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="p" marginBottom={SPACING.spacing5}>
              {t('factory_reset_modal_description')}
            </StyledText>
            <Flex justifyContent={JUSTIFY_FLEX_END}>
              <SecondaryButton
                onClick={closeModal}
                marginRight={SPACING.spacing3}
              >
                {t('factory_reset_model_cancel_button')}
              </SecondaryButton>
              <PrimaryButton
                backgroundColor={COLORS.error}
                onClick={triggerReset}
                disabled={PENDING_STATUS}
              >
                {t('factory_reset_modal_confirm_button')}
              </PrimaryButton>
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <Modal
          title={t('factory_reset_modal_connection_lost_title')}
          icon={reconnectModalIcon}
          onClose={closeModal}
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
