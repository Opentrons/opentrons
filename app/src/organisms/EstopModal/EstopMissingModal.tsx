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

import { StyledText } from '../../atoms/text'
import { LegacyModal } from '../../molecules/LegacyModal'
import { Modal } from '../../molecules/Modal'
import { getIsOnDevice } from '../../redux/config'

import type {
  ModalHeaderBaseProps,
  ModalSize,
} from '../../molecules/Modal/types'
import type { LegacyModalProps } from '../../molecules/LegacyModal'

// Note (07/13/2023) After the launch, we will unify the modal components into one component.
// Then TouchScreenModal and DesktopModal will be TouchScreenContent and DesktopContent that only render each content.

interface EstopMissingModalProps {
  isActiveRun: boolean
  robotName: string
  closeModal: () => void
}

export function EstopMissingModal({
  isActiveRun,
  robotName,
  closeModal,
}: EstopMissingModalProps): JSX.Element {
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <>
      {isOnDevice ? (
        <TouchscreenModal isActiveRun={isActiveRun} robotName={robotName} />
      ) : (
        <DesktopModal
          isActiveRun={isActiveRun}
          robotName={robotName}
          closeModal={closeModal}
        />
      )}
    </>
  )
}

function TouchscreenModal({
  isActiveRun,
  robotName,
}: Omit<EstopMissingModalProps, 'closeModal'>): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalHeader: ModalHeaderBaseProps = {
    title: t('estop_missing'),
    iconName: 'ot-alert',
    iconColor: isActiveRun ? COLORS.white : COLORS.red2,
  }
  const modalProps = {
    header: { ...modalHeader },
    modalSize: 'large' as ModalSize,
    isError: isActiveRun,
  }
  return (
    <Modal {...modalProps}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        marginTop={isActiveRun ? SPACING.spacing32 : undefined}
      >
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

function DesktopModal({
  isActiveRun,
  robotName,
  closeModal,
}: EstopMissingModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalProps: LegacyModalProps = {
    type: isActiveRun ? 'outlinedError' : 'error',
    title: t('estop_missing'),
    onClose: () => closeModal(),
    closeOnOutsideClick: false,
    childrenPadding: isActiveRun ? SPACING.spacing32 : SPACING.spacing24,
    width: '47rem',
  }

  return (
    <LegacyModal
      {...modalProps}
      data-testid={`DesktopEstopMissingModal_${
        isActiveRun ? 'activeRun' : 'inactiveRun'
      }`}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <StyledText as="h1">{t('connect_the_estop_to_continue')}</StyledText>
        <StyledText>
          {t('estop_missing_description', { robotName: robotName })}
        </StyledText>
      </Flex>
    </LegacyModal>
  )
}
