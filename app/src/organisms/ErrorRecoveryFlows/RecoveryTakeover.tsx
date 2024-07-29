import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  COLORS,
  Icon,
  StyledText,
  AlertPrimaryButton,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  TEXT_ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
} from '@opentrons/api-client'

import { useUpdateClientDataRecovery } from '../../resources/client_data'
import { TakeoverModal } from '../TakeoverModal/TakeoverModal'
import { RecoveryInterventionModal } from './shared'

import type {
  ClientDataRecovery,
  UseUpdateClientDataRecoveryResult,
} from '../../resources/client_data'
import type { ErrorRecoveryFlowsProps } from '.'

// The takeover view, functionally similar to MaintenanceRunTakeover
export function RecoveryTakeover(props: {
  intent: ClientDataRecovery['intent']
  runStatus: ErrorRecoveryFlowsProps['runStatus']
  robotName: string
  isOnDevice: boolean
}): JSX.Element {
  const { runStatus } = props
  const { t } = useTranslation('error_recovery')
  const { clearClientData } = useUpdateClientDataRecovery()

  // TODO(jh, 07-29-24): This is likely sufficient for most edge cases, but this does not account for
  // all terminal commands as it should. Revisit this.
  const isTerminateDisabled = !(
    runStatus === RUN_STATUS_AWAITING_RECOVERY ||
    runStatus === RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR ||
    runStatus === RUN_STATUS_AWAITING_RECOVERY_PAUSED
  )

  const buildRecoveryTakeoverProps = (
    intent: ClientDataRecovery['intent']
  ): RecoveryTakeoverProps => {
    switch (intent) {
      case 'canceling':
        return {
          title: t('robot_is_canceling_run'),
          isRunStatusAwaitingRecovery: isTerminateDisabled,
          clearClientData,
          ...props,
        }
      case 'recovering':
      default:
        return {
          title: t('robot_is_in_recovery_mode'),
          isRunStatusAwaitingRecovery: isTerminateDisabled,
          clearClientData,
          ...props,
        }
    }
  }

  return (
    <RecoveryTakeoverComponent {...buildRecoveryTakeoverProps(props.intent)} />
  )
}

interface RecoveryTakeoverProps {
  title: string
  /* Do not let other users terminate activity if run is not awaiting recovery. Ex, the run is "recovery canceling." */
  isRunStatusAwaitingRecovery: boolean
  robotName: string
  isOnDevice: boolean
  clearClientData: UseUpdateClientDataRecoveryResult['clearClientData']
}

export function RecoveryTakeoverComponent(
  props: RecoveryTakeoverProps
): JSX.Element {
  return props.isOnDevice ? (
    <RecoveryTakeoverODD {...props} />
  ) : (
    <RecoveryTakeoverDesktop {...props} />
  )
}

export function RecoveryTakeoverODD({
  title,
  clearClientData,
  isRunStatusAwaitingRecovery,
}: RecoveryTakeoverProps): JSX.Element {
  const [showConfirmation, setShowConfirmation] = React.useState(false)

  return (
    <TakeoverModal
      title={title}
      confirmTerminate={clearClientData}
      setShowConfirmTerminateModal={setShowConfirmation}
      showConfirmTerminateModal={showConfirmation}
      terminateInProgress={isRunStatusAwaitingRecovery}
    />
  )
}

export function RecoveryTakeoverDesktop({
  title,
  robotName,
  clearClientData,
  isRunStatusAwaitingRecovery,
}: RecoveryTakeoverProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  return (
    <RecoveryInterventionModal
      titleHeading={t('error_on_robot', { robot: robotName })}
      desktopType={'desktop-small'}
      isOnDevice={false}
    >
      <Flex css={CONTAINER_STYLE}>
        <Flex css={CONTENT_STYLE}>
          <Icon
            name="alert-circle"
            color={COLORS.red50}
            size={SPACING.spacing40}
          />
          <StyledText desktopStyle="headingSmallBold">{title}</StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('another_app_controlling_robot')}
          </StyledText>
        </Flex>
        <Flex marginLeft="auto">
          <AlertPrimaryButton
            onClick={clearClientData}
            disabled={isRunStatusAwaitingRecovery}
          >
            {t('terminate_remote_activity')}
          </AlertPrimaryButton>
        </Flex>
      </Flex>
    </RecoveryInterventionModal>
  )
}

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
  padding-top: ${SPACING.spacing12};
`

const CONTENT_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};

  text-align: ${TEXT_ALIGN_CENTER};
  padding: ${SPACING.spacing40} ${SPACING.spacing40};
  grid-gap: ${SPACING.spacing16};
`
