import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InlineNotification,
  ModalHeader,
  ModalShell,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getModalPortalEl, getTopPortalEl } from '/app/App/portal'
import { OddModal } from '/app/molecules/OddModal'

import { ERROR_KINDS } from '../constants'
import { useErrorName } from '../hooks'
import { getErrorKind } from '../utils'
import { StepInfo } from './StepInfo'

import type { ReactNode } from 'react'
import type { IconProps } from '@opentrons/components'
import type { LabwareDefinition, RobotType } from '@opentrons/shared-data'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'
import type { ErrorRecoveryFlowsProps } from '..'
import type { ERUtilsResults, useRetainedFailedCommandBySource } from '../hooks'
import type { DesktopSizeType, ErrorKind } from '../types'

export function useErrorDetailsModal(): {
  showModal: boolean
  toggleModal: () => void
} {
  const [showModal, setShowModal] = useState(false)

  const toggleModal = (): void => {
    setShowModal(!showModal)
  }

  return { showModal, toggleModal }
}

type ErrorDetailsModalProps = Omit<
  ErrorRecoveryFlowsProps,
  'unvalidatedFailedCommand'
> &
  ERUtilsResults & {
    toggleModal: () => void
    isOnDevice: boolean
    robotType: RobotType
    desktopType: DesktopSizeType
    failedCommand: ReturnType<typeof useRetainedFailedCommandBySource>
    allRunDefs: LabwareDefinition[]
  }

export function ErrorDetailsModal(props: ErrorDetailsModalProps): ReactNode {
  const { failedCommand, toggleModal, isOnDevice } = props
  const errorKind = getErrorKind(failedCommand)
  const errorName = useErrorName(errorKind)

  const isNotificationErrorKind = (): boolean => {
    switch (errorKind) {
      case ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE:
      case ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING:
      case ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING:
      case ERROR_KINDS.TIP_NOT_DETECTED:
      case ERROR_KINDS.GRIPPER_ERROR:
      case ERROR_KINDS.STALL_OR_COLLISION:
      case ERROR_KINDS.NO_LIQUID_DETECTED:
      case ERROR_KINDS.STACKER_STALLED:
      case ERROR_KINDS.STACKER_HOPPER_EMPTY:
      case ERROR_KINDS.STACKER_SHUTTLE_EMPTY:
      case ERROR_KINDS.STACKER_SHUTTLE_MISSING:
      case ERROR_KINDS.STACKER_SHUTTLE_STORE_EMPTY:
      case ERROR_KINDS.STACKER_SHUTTLE_OCCUPIED:
      case ERROR_KINDS.STACKER_HOPPER_OR_SHUTTLE_EMPTY:
      case ERROR_KINDS.VACUUM_CARBOY_FULL:
      case ERROR_KINDS.VACUUM_PRESSURE_NOT_REACHED:
        return true
      default:
        return false
    }
  }

  const modalHeader: OddModalHeaderBaseProps = {
    title: errorName,
    hasExitIcon: true,
  }

  const buildModal = (): JSX.Element => {
    if (isOnDevice) {
      return createPortal(
        <ErrorDetailsModalODD
          {...props}
          toggleModal={toggleModal}
          modalHeader={modalHeader}
        >
          {isNotificationErrorKind() ? (
            <NotificationBanner errorKind={errorKind} />
          ) : null}
        </ErrorDetailsModalODD>,
        getTopPortalEl()
      )
    } else {
      return createPortal(
        <ErrorDetailsModalDesktop
          {...props}
          toggleModal={toggleModal}
          modalHeader={modalHeader}
        >
          {isNotificationErrorKind() ? (
            <NotificationBanner errorKind={errorKind} />
          ) : null}
        </ErrorDetailsModalDesktop>,
        getModalPortalEl()
      )
    }
  }

  return buildModal()
}

type ErrorDetailsModalType = ErrorDetailsModalProps & {
  children: ReactNode
  modalHeader: OddModalHeaderBaseProps
  toggleModal: () => void
  desktopType: DesktopSizeType
}

export function ErrorDetailsModalDesktop(
  props: ErrorDetailsModalType
): ReactNode {
  const { children, modalHeader, toggleModal, desktopType } = props
  const { t } = useTranslation(['error_recovery', 'branded'])

  const buildIcon = (): IconProps => {
    return {
      name: 'information',
      color: COLORS.grey60,
      size: SPACING.spacing20,
      style: { marginRight: SPACING.spacing8 },
    }
  }

  const buildHeader = (): JSX.Element => {
    return (
      <ModalHeader
        onClose={toggleModal}
        title={t('error_details')}
        icon={buildIcon()}
        color={COLORS.black90}
        backgroundColor={COLORS.white}
      />
    )
  }

  return (
    <ModalShell
      header={buildHeader()}
      css={
        desktopType === 'desktop-small'
          ? DESKTOP_MODAL_STYLE_SMALL
          : DESKTOP_MODAL_STYLE_LARGE
      }
    >
      <Flex
        padding={SPACING.spacing24}
        gridGap={SPACING.spacing24}
        flexDirection={DIRECTION_COLUMN}
      >
        <StyledText desktopStyle="headingSmallBold">
          {modalHeader.title}
        </StyledText>
        {children}
        <Flex css={DESKTOP_STEP_INFO_STYLE}>
          <StepInfo {...props} desktopStyle="bodyDefaultRegular" />
        </Flex>
      </Flex>
    </ModalShell>
  )
}

export function ErrorDetailsModalODD(props: ErrorDetailsModalType): ReactNode {
  const { children, modalHeader, toggleModal } = props

  return (
    <OddModal
      header={modalHeader}
      onOutsideClick={toggleModal}
      zIndex={15}
      gridGap={SPACING.spacing32}
    >
      <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
        {children}
        <Flex
          gridGap={SPACING.spacing16}
          backgroundColor={COLORS.grey35}
          borderRadius={BORDERS.borderRadius8}
          padding={`${SPACING.spacing16} ${SPACING.spacing20}`}
        >
          <StepInfo {...props} desktopStyle="bodyDefaultRegular" />
        </Flex>
      </Flex>
    </OddModal>
  )
}

export function NotificationBanner({
  errorKind,
}: {
  errorKind: ErrorKind
}): ReactNode {
  const buildContent = (): JSX.Element => {
    switch (errorKind) {
      case ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE:
      case ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING:
      case ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING:
        return <OverpressureBanner />
      case ERROR_KINDS.TIP_NOT_DETECTED:
        return <TipNotDetectedBanner />
      case ERROR_KINDS.GRIPPER_ERROR:
        return <GripperErrorBanner />
      case ERROR_KINDS.STALL_OR_COLLISION:
        return <StallErrorBanner />
      case ERROR_KINDS.NO_LIQUID_DETECTED:
        return <NoLiquidDetectedBanner />
      case ERROR_KINDS.STACKER_STALLED:
        return <StackerStallErrorBanner />
      case ERROR_KINDS.STACKER_HOPPER_EMPTY:
        return <LabwareMissingErrorBanner />
      case ERROR_KINDS.STACKER_SHUTTLE_EMPTY:
        return <LabwareMissingOnShuttleErrorBanner />
      case ERROR_KINDS.STACKER_SHUTTLE_MISSING:
        return <StackerShuttleMissingErrorBanner />
      case ERROR_KINDS.STACKER_SHUTTLE_STORE_EMPTY:
        return <StackerShuttleStoreEmptyErrorBanner />
      case ERROR_KINDS.STACKER_SHUTTLE_OCCUPIED:
        return <StackerShuttleOccupiedErrorBanner />
      case ERROR_KINDS.STACKER_HOPPER_OR_SHUTTLE_EMPTY:
        return <StackerHopperOrShuttleEmptyErrorBanner />
      case ERROR_KINDS.VACUUM_CARBOY_FULL:
        return <VacuumCarboyFullErrorBanner />
      case ERROR_KINDS.VACUUM_PRESSURE_NOT_REACHED:
        return <VacuumPressureNotReachedErrorBanner />
      default:
        console.error('Handle error kind notification banners explicitly.')
        return <div />
    }
  }

  return buildContent()
}

export function OverpressureBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('overpressure_is_usually_caused')}
      message={t('if_issue_persists_overpressure')}
    />
  )
}

export function TipNotDetectedBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('tip_presence_errors_are_caused')}
      message={t('if_issue_persists_tip_not_detected')}
    />
  )
}

export function GripperErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('gripper_errors_occur_when')}
      message={t('if_issue_persists_gripper_error')}
    />
  )
}

export function StallErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('stall_or_collision_detected_when')}
      message={t('the_robot_must_return_to_home_position')}
    />
  )
}

export function StackerStallErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('stall_or_collision_detected_when')}
      message={t('clear_obstructions_before_proceeding')}
    />
  )
}

export function LabwareMissingErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('labware_missing_detected_when')}
      message={t('load_stacker_with_correct_labware')}
    />
  )
}

export function StackerShuttleMissingErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('stacker_shuttle_missing_error_occurs_when')}
      message={t('load_stacker_shuttle_to_proceed')}
    />
  )
}

export function StackerShuttleStoreEmptyErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('stacker_shuttle_store_empty_error_occurs_when')}
      message={t('load_labware_shuttle_to_proceed')}
    />
  )
}

export function StackerShuttleOccupiedErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('stacker_shuttle_occupied_error_occurs_when')}
      message={t('remove_labware_from_shuttle_to_proceed')}
    />
  )
}

export function StackerHopperOrShuttleEmptyErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('stacker_hopper_or_shuttle_empty_error_occurs_when')}
      message={t('troubleshoot_issue_complete_retrieve_step')}
    />
  )
}

export function LabwareMissingOnShuttleErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('stacker_latch_jammed_errors_occur_when')}
      message={t('branded:if_issue_persists_call_support')}
    />
  )
}

export function NoLiquidDetectedBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('droplets_or_liquid_cause_failure')}
      message={t('use_dry_unused_tips')}
    />
  )
}

export function VacuumCarboyFullErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      message={t('waste_carboy_must_be_emptied')}
    />
  )
}

export function VacuumPressureNotReachedErrorBanner(): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      message={t('vacuum_did_not_reach_pressure')}
    />
  )
}
// TODO(jh, 07-24-24): Using shared height/width constants for intervention modal sizing and the ErrorDetailsModal sizing
// would be ideal.
const DESKTOP_STEP_INFO_STYLE = css`
  background-color: ${COLORS.grey30};
  grid-gap: ${SPACING.spacing10};
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing6} ${SPACING.spacing24} ${SPACING.spacing6}
    ${SPACING.spacing12};
`

const DESKTOP_MODAL_STYLE_BASE = css`
  width: 47rem;
`

const DESKTOP_MODAL_STYLE_SMALL = css`
  ${DESKTOP_MODAL_STYLE_BASE}
  height: 26rem;
`
const DESKTOP_MODAL_STYLE_LARGE = css`
  ${DESKTOP_MODAL_STYLE_BASE}
  height: 31rem;
`
