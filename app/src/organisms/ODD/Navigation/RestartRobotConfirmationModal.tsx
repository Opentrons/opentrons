import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { restartRobot } from '/app/redux/robot-admin'

import type { Dispatch } from '/app/redux/types'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

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
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('restart_now'),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }
  const dispatch = useDispatch<Dispatch>()

  return (
    <OddModal header={modalHeader}>
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
              <LegacyStyledText
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
            onClick={() => {
              setShowRestartRobotConfirmationModal(false)
            }}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={i18n.format(t('shared:restart'), 'capitalize')}
            onClick={() => dispatch(restartRobot(robotName))}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
