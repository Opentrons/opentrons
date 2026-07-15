import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'
import {
  useCreateLiveCommandMutation,
  useSetLightsMutation,
} from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
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
    title: t('turn_off_robot'),
    iconName: 'power-off',
  }
  const dispatch = useDispatch<Dispatch>()
  const { setLights } = useSetLightsMutation()
  // TODO(jj): setStatusBar will fail in CRS mode.
  // We don't want to prompt the user for documentation or require login here
  // We need to add a new backend endpoint for setStatusBar specifically.
  const { createLiveCommand } = useCreateLiveCommandMutation(
    ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
  )

  return (
    <OddModal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Trans
          t={t}
          i18nKey="turn_off_robot_confirmation_description"
          values={{ robotName }}
          components={{
            bold: <strong />,
            span: (
              <LegacyStyledText
                forwardedAs="p"
                data-testid="turn_off_robot_confirmation_description"
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
              createLiveCommand({
                command: {
                  commandType: 'setStatusBar',
                  params: { animation: 'off' },
                },
              })
                .catch(() => {
                  console.warn('Failed to set status bar animation to off')
                })
                .finally(() => {
                  setLights({ on: false })
                  dispatch(shutdownRobot(robotName))
                })
            }}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
