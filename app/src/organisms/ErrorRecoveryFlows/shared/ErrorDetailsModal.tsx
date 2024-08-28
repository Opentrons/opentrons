import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { css } from 'styled-components'

import {
  Flex,
  StyledText,
  SPACING,
  COLORS,
  ModalShell,
  ModalHeader,
  BORDERS,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { useErrorName } from '../hooks'
import { OddModal } from '../../../molecules/OddModal'
import { getModalPortalEl, getTopPortalEl } from '../../../App/portal'
import { ERROR_KINDS } from '../constants'
import { InlineNotification } from '../../../atoms/InlineNotification'
import { StepInfo } from './StepInfo'
import { getErrorKind } from '../utils'

import type { RobotType } from '@opentrons/shared-data'
import type { IconProps } from '@opentrons/components'
import type { OddModalHeaderBaseProps } from '../../../molecules/OddModal/types'
import type { ERUtilsResults, useRetainedFailedCommandBySource } from '../hooks'
import type { ErrorRecoveryFlowsProps } from '..'
import type { DesktopSizeType } from '../types'

export function useErrorDetailsModal(): {
  showModal: boolean
  toggleModal: () => void
} {
  const [showModal, setShowModal] = React.useState(false)

  const toggleModal = (): void => {
    setShowModal(!showModal)
  }

  return { showModal, toggleModal }
}

type ErrorDetailsModalProps = Omit<
  ErrorRecoveryFlowsProps,
  'failedCommandByRunRecord'
> &
  ERUtilsResults & {
    toggleModal: () => void
    isOnDevice: boolean
    robotType: RobotType
    desktopType: DesktopSizeType
    failedCommand: ReturnType<typeof useRetainedFailedCommandBySource>
  }

export function ErrorDetailsModal(props: ErrorDetailsModalProps): JSX.Element {
  const { failedCommand, toggleModal, isOnDevice } = props
  const errorKind = getErrorKind(failedCommand?.byRunRecord ?? null)
  const errorName = useErrorName(errorKind)

  const getIsOverpressureErrorKind = (): boolean => {
    switch (errorKind) {
      case ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE:
      case ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING:
      case ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING:
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
          {getIsOverpressureErrorKind() ? <OverpressureBanner /> : null}
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
          {getIsOverpressureErrorKind() ? <OverpressureBanner /> : null}
        </ErrorDetailsModalDesktop>,
        getModalPortalEl()
      )
    }
  }

  return buildModal()
}

type ErrorDetailsModalType = ErrorDetailsModalProps & {
  children: React.ReactNode
  modalHeader: OddModalHeaderBaseProps
  toggleModal: () => void
  desktopType: DesktopSizeType
}

export function ErrorDetailsModalDesktop(
  props: ErrorDetailsModalType
): JSX.Element {
  const { children, modalHeader, toggleModal, desktopType } = props
  const { t } = useTranslation('error_recovery')

  const buildIcon = (): IconProps => {
    return {
      name: 'information',
      color: COLORS.grey60,
      size: SPACING.spacing20,
      marginRight: SPACING.spacing8,
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

export function ErrorDetailsModalODD(
  props: ErrorDetailsModalType
): JSX.Element {
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

export function OverpressureBanner(): JSX.Element | null {
  const { t } = useTranslation('error_recovery')

  return (
    <InlineNotification
      type="alert"
      heading={t('overpressure_is_usually_caused')}
      message={t('if_issue_persists')}
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
