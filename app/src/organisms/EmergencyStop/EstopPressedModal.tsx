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
  LegacyStyledText,
  ListItem,
  Modal,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useAcknowledgeEstopDisengageMutation } from '@opentrons/react-api-client'

import { getTopPortalEl } from '../../App/portal'
import { Banner } from '../../atoms/Banner'
import { SmallButton } from '../../atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { getIsOnDevice } from '/app/redux/config'

import type {
  OddModalHeaderBaseProps,
  ModalSize,
} from '/app/molecules/OddModal/types'
import type { ModalProps } from '@opentrons/components'

// Note (07/13/2023) After the launch, we will unify the modal components into one component.
// Then TouchScreenModal and DesktopModal will be TouchScreenContent and DesktopContent that only render each content.
interface EstopPressedModalProps {
  isEngaged: boolean
  closeModal: () => void
  isDismissedModal?: boolean
  setIsDismissedModal?: (isDismissedModal: boolean) => void
  isWaitingForLogicalDisengage: boolean
  setShouldSeeLogicalDisengage: () => void
}

export function EstopPressedModal({
  isEngaged,
  closeModal,
  isDismissedModal,
  setIsDismissedModal,
  isWaitingForLogicalDisengage,
  setShouldSeeLogicalDisengage,
}: EstopPressedModalProps): JSX.Element {
  const isOnDevice = useSelector(getIsOnDevice)
  return createPortal(
    isOnDevice ? (
      <TouchscreenModal
        isEngaged={isEngaged}
        closeModal={closeModal}
        isWaitingForLogicalDisengage={isWaitingForLogicalDisengage}
        setShouldSeeLogicalDisengage={setShouldSeeLogicalDisengage}
      />
    ) : (
      <>
        {isDismissedModal === false ? (
          <DesktopModal
            isEngaged={isEngaged}
            closeModal={closeModal}
            setIsDismissedModal={setIsDismissedModal}
            isWaitingForLogicalDisengage={isWaitingForLogicalDisengage}
            setShouldSeeLogicalDisengage={setShouldSeeLogicalDisengage}
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
  isWaitingForLogicalDisengage,
  setShouldSeeLogicalDisengage,
}: EstopPressedModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'branded'])
  const [isResuming, setIsResuming] = React.useState<boolean>(false)
  const { acknowledgeEstopDisengage } = useAcknowledgeEstopDisengageMutation()
  const modalHeader: OddModalHeaderBaseProps = {
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
    setShouldSeeLogicalDisengage()
    closeModal()
  }
  return (
    <OddModal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing40}>
        <LegacyStyledText as="p" fontWeight>
          {t('branded:estop_pressed_description')}
        </LegacyStyledText>
        <ListItem
          type={isEngaged ? 'error' : 'success'}
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          borderRadius={BORDERS.borderRadius8}
        >
          <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('estop')}
          </LegacyStyledText>
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
          iconName={
            isResuming || isWaitingForLogicalDisengage
              ? 'ot-spinner'
              : undefined
          }
          iconPlacement={
            isResuming || isWaitingForLogicalDisengage ? 'startIcon' : undefined
          }
          buttonText={t('resume_robot_operations')}
          disabled={isEngaged || isResuming || isWaitingForLogicalDisengage}
          onClick={handleClick}
        />
      </Flex>
    </OddModal>
  )
}

function DesktopModal({
  isEngaged,
  closeModal,
  setIsDismissedModal,
  isWaitingForLogicalDisengage,
  setShouldSeeLogicalDisengage,
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

  const modalProps: ModalProps = {
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
    acknowledgeEstopDisengage(
      {},
      {
        onSuccess: () => {
          setShouldSeeLogicalDisengage()
          closeModal()
        },
        onError: (error: any) => {
          setIsResuming(false)
          console.error(error)
        },
      }
    )
  }

  return (
    <Modal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Banner type={isEngaged ? 'error' : 'success'}>
          {isEngaged ? t('estop_engaged') : t('estop_disengaged')}
        </Banner>
        <LegacyStyledText as="p" color={COLORS.grey60}>
          {t('branded:estop_pressed_description')}
        </LegacyStyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <PrimaryButton
            onClick={handleClick}
            disabled={isEngaged || isResuming || isWaitingForLogicalDisengage}
          >
            <Flex
              flexDirection={DIRECTION_ROW}
              gridGap={SPACING.spacing8}
              alignItems={ALIGN_CENTER}
            >
              {isResuming || isWaitingForLogicalDisengage ? (
                <Icon size="1rem" spin name="ot-spinner" />
              ) : null}
              {t('resume_robot_operations')}
            </Flex>
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
