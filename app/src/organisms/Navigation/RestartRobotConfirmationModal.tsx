import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { restartRobot } from '../../redux/robot-admin'

import { Dispatch } from '../../redux/types'
import { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface RestartRobotConfirmationModalProps {
  robotName: string
  setShowRestartRobotConfirmationModal: (
    showRestartRobotConfirmationModal: boolean
  ) => void
}
export function RestartRobotConfirmationModal({
  robotName,
  setShowRestartRobotConfirmationModal,
}: RestartRobotConfirmationModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const modalHeader: ModalHeaderBaseProps = {
    title: t('restart_now'),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow2,
  }
  const dispatch = useDispatch<Dispatch>()

  return (
    <Modal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Trans
          t={t}
          i18nKey="restart_robot_confirmation_description"
          values={{ robotName: robotName }}
          components={{
            bold: <strong />,
            span: (
              <StyledText
                as="p"
                data-testid="restart_robot_confirmation_description"
              />
            ),
          }}
        />
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
          <SmallButton
            flex="1"
            buttonText={t('shared:go_back')}
            onClick={() => setShowRestartRobotConfirmationModal(false)}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={i18n.format(t('shared:restart'), 'capitalize')}
            onClick={() => dispatch(restartRobot(robotName))}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
