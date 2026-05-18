import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'
import { useSetLightsMutation } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { shutdownRobot } from '/app/redux/robot-admin'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'
import type { Dispatch } from '/app/redux/types'

interface ShutdownRobotConfirmationModalProps {
  robotName: string
  setShowShutdownRobotConfirmationModal: (
    showShutdownRobotConfirmationModal: boolean
  ) => void
}
export function ShutdownRobotConfirmationModal({
  robotName,
  setShowShutdownRobotConfirmationModal,
}: ShutdownRobotConfirmationModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const modalHeader: OddModalHeaderBaseProps = {
    // TODO(jh, 05-18-26): Update after Design finalizes implementation
    title: t('shutdown_now'),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }
  const dispatch = useDispatch<Dispatch>()
  const { setLights } = useSetLightsMutation()

  return (
    <OddModal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Trans
          t={t}
          i18nKey="shutdown_robot_confirmation_description"
          values={{ robotName: robotName }}
          components={{
            bold: <strong />,
            span: (
              <LegacyStyledText
                forwardedAs="p"
                data-testid="shutdown_robot_confirmation_description"
              />
            ),
          }}
        />
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
          <SmallButton
            flex="1"
            buttonText={t('shared:go_back')}
            onClick={() => {
              setShowShutdownRobotConfirmationModal(false)
            }}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={i18n.format(t('shared:shutdown'), 'capitalize')}
            onClick={() => {
              setLights({ on: false })
              dispatch(shutdownRobot(robotName))
            }}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
