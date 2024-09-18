import * as React from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  Modal,
} from '@opentrons/components'

import { getTopPortalEl } from '../../App/portal'
import { OddModal } from '/app/molecules/OddModal'
import { getIsOnDevice } from '/app/redux/config'

import type { ModalProps } from '@opentrons/components'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

// Note (07/13/2023) After the launch, we will unify the modal components into one component.
// Then TouchScreenModal and DesktopModal will be TouchScreenContent and DesktopContent that only render each content.

interface EstopMissingModalProps {
  robotName: string
  closeModal: () => void
  isDismissedModal: boolean
  setIsDismissedModal: (isDismissedModal: boolean) => void
}

export function EstopMissingModal({
  robotName,
  closeModal,
  isDismissedModal,
  setIsDismissedModal,
}: EstopMissingModalProps): JSX.Element {
  const isOnDevice = useSelector(getIsOnDevice)

  return createPortal(
    isOnDevice ? (
      <TouchscreenModal robotName={robotName} closeModal={closeModal} />
    ) : (
      <>
        {isDismissedModal === false ? (
          <DesktopModal
            robotName={robotName}
            closeModal={closeModal}
            setIsDismissedModal={setIsDismissedModal}
          />
        ) : null}
      </>
    ),
    getTopPortalEl()
  )
}

interface EstopMissingTouchscreenModalProps
  extends Omit<
    EstopMissingModalProps,
    'isDismissedModal' | 'setIsDismissedModal'
  > {}

function TouchscreenModal({
  robotName,
}: EstopMissingTouchscreenModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('estop_missing'),
    iconName: 'ot-alert',
    iconColor: COLORS.red50,
  }
  const modalProps = {
    header: { ...modalHeader },
  }

  return (
    <OddModal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('connect_the_estop_to_continue')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          {t('estop_missing_description', { robotName: robotName })}
        </LegacyStyledText>
      </Flex>
    </OddModal>
  )
}

interface EstopMissingDesktopModalProps
  extends Omit<EstopMissingModalProps, 'isDismissedModal'> {}

function DesktopModal({
  robotName,
  closeModal,
  setIsDismissedModal,
}: EstopMissingDesktopModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const handleCloseModal = (): void => {
    if (setIsDismissedModal != null) {
      setIsDismissedModal(true)
    }
    closeModal()
  }

  const modalProps: ModalProps = {
    type: 'error',
    title: t('estop_missing'),
    onClose: handleCloseModal,
    closeOnOutsideClick: false,
    childrenPadding: SPACING.spacing24,
    width: '47rem',
  }

  return (
    <Modal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <LegacyStyledText as="h1">
          {t('connect_the_estop_to_continue')}
        </LegacyStyledText>
        <LegacyStyledText>
          {t('estop_missing_description', { robotName: robotName })}
        </LegacyStyledText>
      </Flex>
    </Modal>
  )
}
