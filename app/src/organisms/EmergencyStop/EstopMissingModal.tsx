import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Portal } from '../../App/portal'
import { StyledText } from '../../atoms/text'
import { LegacyModal } from '../../molecules/LegacyModal'
import { Modal } from '../../molecules/Modal'
import { getIsOnDevice } from '../../redux/config'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type { LegacyModalProps } from '../../molecules/LegacyModal'

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

  return (
    <Portal level="top">
      {isOnDevice ? (
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
      )}
    </Portal>
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
  const modalHeader: ModalHeaderBaseProps = {
    title: t('estop_missing'),
    iconName: 'ot-alert',
    iconColor: COLORS.red2,
  }
  const modalProps = {
    header: { ...modalHeader },
  }

  return (
    <Modal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('connect_the_estop_to_continue')}
        </StyledText>
        <StyledText as="p">
          {t('estop_missing_description', { robotName: robotName })}
        </StyledText>
      </Flex>
    </Modal>
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

  const modalProps: LegacyModalProps = {
    type: 'error',
    title: t('estop_missing'),
    onClose: handleCloseModal,
    closeOnOutsideClick: false,
    childrenPadding: SPACING.spacing24,
    width: '47rem',
  }

  return (
    <LegacyModal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <StyledText as="h1">{t('connect_the_estop_to_continue')}</StyledText>
        <StyledText>
          {t('estop_missing_description', { robotName: robotName })}
        </StyledText>
      </Flex>
    </LegacyModal>
  )
}
