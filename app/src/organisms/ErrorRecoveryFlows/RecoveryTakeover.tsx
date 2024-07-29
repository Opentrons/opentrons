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

import { useUpdateClientDataRecovery } from '../../resources/client_data'
import { TakeoverModal } from '../TakeoverModal/TakeoverModal'
import { RecoveryInterventionModal } from './shared'

import type {
  ClientDataRecovery,
  UseUpdateClientDataRecoveryResult,
} from '../../resources/client_data'

// The takeover view, functionally similar to MaintenanceRunTakeover
export function RecoveryTakeover(props: {
  intent: ClientDataRecovery['intent']
  robotName: string
  isOnDevice: boolean
}): JSX.Element {
  const { t } = useTranslation('error_recovery')
  const { clearClientData } = useUpdateClientDataRecovery()

  const buildRecoveryTakeoverProps = (
    intent: ClientDataRecovery['intent']
  ): RecoveryTakeoverProps => {
    switch (intent) {
      case 'canceling':
        return {
          title: t('robot_is_canceling_run'),
          clearClientData,
          ...props,
        }
      case 'recovering':
      default:
        return {
          title: t('robot_is_in_recovery_mode'),
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
}: RecoveryTakeoverProps): JSX.Element {
  const [showConfirmation, setShowConfirmation] = React.useState(false)

  return (
    <TakeoverModal
      title={title}
      confirmTerminate={clearClientData}
      setShowConfirmTerminateModal={setShowConfirmation}
      showConfirmTerminateModal={showConfirmation}
      terminateInProgress={false}
    />
  )
}

export function RecoveryTakeoverDesktop({
  title,
  robotName,
  clearClientData,
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
          <AlertPrimaryButton onClick={clearClientData}>
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
