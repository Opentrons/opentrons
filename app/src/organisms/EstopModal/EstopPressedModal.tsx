import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Banner } from '../../atoms/Banner'
import { Chip } from '../../atoms/Chip'
import { ListItem } from '../../atoms/ListItem'
import { SmallButton } from '../../atoms/buttons'
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
interface EstopPressedModalProps {
  isEngaged: boolean
  closeModal: () => void
}

export function EstopPressedModal({
  isEngaged,
  closeModal,
}: EstopPressedModalProps): JSX.Element {
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <>
      {isOnDevice ? (
        <TouchscreenModal isEngaged={isEngaged} />
      ) : (
        <DesktopModal isEngaged={isEngaged} closeModal={closeModal} />
      )}
    </>
  )
}

function TouchscreenModal({
  isEngaged,
}: Omit<EstopPressedModalProps, 'closeModal'>): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalHeader: ModalHeaderBaseProps = {
    title: t('estop_pressed'),
    iconName: 'ot-alert',
    iconColor: COLORS.red2,
  }
  const modalProps = {
    header: { ...modalHeader },
    modalSize: 'large' as ModalSize,
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
          buttonText={t('resume_robot_operations')}
          disabled={isEngaged}
          // ToDo (kk:07/17/2023) the function will be implemented by a following pr
          onClick={() => console.log('pressed')}
        />
      </Flex>
    </Modal>
  )
}

function DesktopModal({
  isEngaged,
  closeModal,
}: EstopPressedModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalProps: LegacyModalProps = {
    type: 'error',
    title: t('estop_pressed'),
    onClose: () => closeModal(),
    closeOnOutsideClick: false,
    childrenPadding: SPACING.spacing24,
    width: '47rem',
  }

  const handleClick = (): void => {
    // ToDo (kk:07/11/2023) this will be implemented by a following pr
    console.log('resume robot operations')
  }

  return (
    <LegacyModal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Banner type={isEngaged ? 'error' : 'success'}>
          {isEngaged ? t('estop_engaged') : t('estop_disengaged')}
        </Banner>
        <StyledText as="p" color={COLORS.darkBlack90}>
          {t('estop_pressed_description')}
        </StyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <PrimaryButton onClick={handleClick} disabled={isEngaged}>
            {t('resume_robot_operations')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}
