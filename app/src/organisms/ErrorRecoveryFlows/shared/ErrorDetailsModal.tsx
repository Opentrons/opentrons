import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

import {
  Flex,
  SPACING,
  COLORS,
  BORDERS,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { useErrorName } from '../hooks'
import { Modal } from '../../../molecules/Modal'
import { getTopPortalEl } from '../../../App/portal'
import { ERROR_KINDS } from '../constants'
import { InlineNotification } from '../../../atoms/InlineNotification'
import { StepInfo } from './StepInfo'
import { getErrorKind } from '../utils'

import type { RobotType } from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../../molecules/Modal/types'
import type { ERUtilsResults } from '../hooks'
import type { ErrorRecoveryFlowsProps } from '..'

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

type ErrorDetailsModalProps = ErrorRecoveryFlowsProps &
  ERUtilsResults & {
    toggleModal: () => void
    isOnDevice: boolean
    robotType: RobotType
  }

export function ErrorDetailsModal(
  props: ErrorDetailsModalProps
): JSX.Element | null {
  if (props.isOnDevice) {
    return <ErrorDetailsModalODD {...props} />
  } else {
    return null
  }
}

// For ODD use only.
export function ErrorDetailsModalODD(
  props: ErrorDetailsModalProps
): JSX.Element {
  const { failedCommand, toggleModal, isOnDevice } = props
  const errorKind = getErrorKind(failedCommand?.error?.errorType)
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

  const modalHeader: ModalHeaderBaseProps = {
    title: errorName,
    hasExitIcon: true,
  }

  return createPortal(
    <Modal
      header={modalHeader}
      onOutsideClick={toggleModal}
      zIndex={15}
      gridGap={SPACING.spacing32}
    >
      <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
        {getIsOverpressureErrorKind() ? (
          <OverpressureBanner isOnDevice={isOnDevice} />
        ) : null}
        <Flex
          gridGap={SPACING.spacing16}
          backgroundColor={COLORS.grey35}
          borderRadius={BORDERS.borderRadius8}
          padding={`${SPACING.spacing16} ${SPACING.spacing20}`}
        >
          <StepInfo {...props} as="label" />
        </Flex>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}

export function OverpressureBanner(props: {
  isOnDevice: boolean
}): JSX.Element | null {
  const { t } = useTranslation('error_recovery')

  if (props.isOnDevice) {
    return (
      <InlineNotification
        type="alert"
        heading={t('overpressure_is_usually_caused')}
      />
    )
  } else {
    return null
  }
}
