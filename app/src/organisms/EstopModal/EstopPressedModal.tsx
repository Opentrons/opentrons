import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
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
  isActiveRun: boolean
  isEngaged: boolean
  closeModal: () => void
}

export function EstopPressedModal({
  isActiveRun,
  isEngaged,
  closeModal,
}: EstopPressedModalProps): JSX.Element {
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <>
      {isOnDevice ? (
        <TouchscreenModal isActiveRun={isActiveRun} isEngaged={isEngaged} />
      ) : (
        <DesktopModal
          isActiveRun={isActiveRun}
          isEngaged={isEngaged}
          closeModal={closeModal}
        />
      )}
    </>
  )
}

function TouchscreenModal({
  isActiveRun,
  isEngaged,
}: Omit<EstopPressedModalProps, 'closeModal'>): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalHeader: ModalHeaderBaseProps = {
    title: t('estop_pressed'),
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
        gridGap={SPACING.spacing40}
        marginTop={isActiveRun ? SPACING.spacing32 : undefined}
      >
        <StyledText as="p" fontWeight>
          {t('estop_pressed_description')}
        </StyledText>
        <Flex
          backgroundColor={isEngaged ? COLORS.red3 : COLORS.green3}
          padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
          borderRadius={BORDERS.borderRadiusSize3}
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
        </Flex>
        <SmallButton
          data-testid={`Estop_pressed_${
            isActiveRun ? 'activeRun' : 'inactiveRun'
          }_button`}
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
  isActiveRun,
  isEngaged,
  closeModal,
}: EstopPressedModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalProps: LegacyModalProps = {
    type: isActiveRun ? 'outlinedError' : 'error',
    title: t('estop_pressed'),
    onClose: () => closeModal(),
    closeOnOutsideClick: false,
    childrenPadding: isActiveRun ? SPACING.spacing32 : SPACING.spacing24,
    width: '47rem',
  }

  const handleClick = (): void => {
    // ToDo (kk:07/11/2023) this will be implemented by a following pr
    console.log('resume robot operations')
  }

  return (
    <LegacyModal
      {...modalProps}
      data-testid={`DesktopEstopModal_${
        isActiveRun ? 'activeRun' : 'inactiveRun'
      }`}
    >
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
