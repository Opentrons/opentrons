import * as React from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  Chip,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useAcknowledgeEstopDisengageMutation } from '@opentrons/react-api-client'

import { getTopPortalEl } from '../../App/portal'
import { Banner } from '../../atoms/Banner'
import { ListItem } from '../../atoms/ListItem'
import { SmallButton } from '../../atoms/buttons'
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
interface EstopPressedModalProps {
  isEngaged: boolean
  closeModal: () => void
  isDismissedModal?: boolean
  setIsDismissedModal?: (isDismissedModal: boolean) => void
}

export function EstopPressedModal({
  isEngaged,
  closeModal,
  isDismissedModal,
  setIsDismissedModal,
}: EstopPressedModalProps): JSX.Element {
  const isOnDevice = useSelector(getIsOnDevice)
  return createPortal(
    isOnDevice ? (
      <TouchscreenModal isEngaged={isEngaged} closeModal={closeModal} />
    ) : (
      <>
        {isDismissedModal === false ? (
          <DesktopModal
            isEngaged={isEngaged}
            closeModal={closeModal}
            setIsDismissedModal={setIsDismissedModal}
          />
        ) : null}
      </>
    ),
    getTopPortalEl()
  )
}

function TouchscreenModal({
  isEngaged,
  closeModal,
}: EstopPressedModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [isResuming, setIsResuming] = React.useState<boolean>(false)
  const { acknowledgeEstopDisengage } = useAcknowledgeEstopDisengageMutation()
  const modalHeader: ModalHeaderBaseProps = {
    title: t('estop_pressed'),
    iconName: 'ot-alert',
    iconColor: COLORS.red50,
  }
  const modalProps = {
    header: { ...modalHeader },
    modalSize: 'large' as ModalSize,
  }
  const handleClick = (): void => {
    setIsResuming(true)
    acknowledgeEstopDisengage(null)
    closeModal()
  }
  return (
    <Modal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing40}>
        <StyledText as="p" fontWeight>
          {t('estop_pressed_description')}
        </StyledText>
        <ListItem
          type={isEngaged ? 'error' : 'success'}
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          borderRadius={BORDERS.borderRadius8}
        >
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('estop')}
          </StyledText>
          <Chip
            type={isEngaged ? 'error' : 'success'}
            text={isEngaged ? t('engaged') : t('disengaged')}
            iconName="connection-status"
            background={false}
          />
        </ListItem>
        <SmallButton
          data-testid="Estop_pressed_button"
          width="100%"
          iconName={isResuming ? 'ot-spinner' : undefined}
          iconPlacement={isResuming ? 'startIcon' : undefined}
          buttonText={t('resume_robot_operations')}
          disabled={isEngaged || isResuming}
          onClick={handleClick}
        />
      </Flex>
    </Modal>
  )
}

function DesktopModal({
  isEngaged,
  closeModal,
  setIsDismissedModal,
}: EstopPressedModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [isResuming, setIsResuming] = React.useState<boolean>(false)
  const { acknowledgeEstopDisengage } = useAcknowledgeEstopDisengageMutation()

  const handleCloseModal = (): void => {
    if (setIsDismissedModal != null) {
      setIsDismissedModal(true)
    }
    closeModal()
  }

  const modalProps: LegacyModalProps = {
    type: 'error',
    title: t('estop_pressed'),
    onClose: handleCloseModal,
    closeOnOutsideClick: false,
    childrenPadding: SPACING.spacing24,
    width: '47rem',
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e): void => {
    e.preventDefault()
    setIsResuming(true)
    acknowledgeEstopDisengage({
      onSuccess: () => {
        closeModal()
      },
      onError: () => {
        setIsResuming(false)
      },
    })
  }

  return (
    <LegacyModal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Banner type={isEngaged ? 'error' : 'success'}>
          {isEngaged ? t('estop_engaged') : t('estop_disengaged')}
        </Banner>
        <StyledText as="p" color={COLORS.grey60}>
          {t('estop_pressed_description')}
        </StyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <PrimaryButton
            onClick={handleClick}
            disabled={isEngaged || isResuming}
          >
            <Flex
              flexDirection={DIRECTION_ROW}
              gridGap={SPACING.spacing8}
              alignItems={ALIGN_CENTER}
            >
              {isResuming ? <Icon size="1rem" spin name="ot-spinner" /> : null}
              {t('resume_robot_operations')}
            </Flex>
          </PrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}
