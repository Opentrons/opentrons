import { Trans, useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { OddModal } from '/app/molecules/OddModal'
import { useFullShutdownMutation } from '/app/resources/devices/hooks/useFullShutdownMutation'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

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
  const documentationState = useDocumentationState()
  const fullShutdownMutation = useFullShutdownMutation(documentationState)

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
              fullShutdownMutation.mutate()
            }}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
