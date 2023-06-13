import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Portal } from '../../App/portal'
import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface TakeoverModalProps {
  showConfirmTerminateModal: boolean
  setShowConfirmTerminateModal: React.Dispatch<React.SetStateAction<boolean>>
  confirmTerminate: () => void
  terminateInProgress: boolean
}

export function TakeoverModal(props: TakeoverModalProps): JSX.Element {
  const {
    showConfirmTerminateModal,
    setShowConfirmTerminateModal,
    confirmTerminate,
    terminateInProgress,
  } = props
  const { i18n, t } = useTranslation('shared')

  const terminateHeader: ModalHeaderBaseProps = {
    title: t('terminate') + '?',
    iconName: 'ot-alert',
    iconColor: COLORS.yellow2,
  }

  return (
    <Portal level="top">
      {showConfirmTerminateModal ? (
        //    confirm terminate modal
        <Modal header={terminateHeader}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="p" marginBottom={SPACING.spacing32}>
              {t('confirm_terminate')}
            </StyledText>
            <Flex flex="1" gridGap={SPACING.spacing8}>
              <SmallButton
                buttonType="primary"
                onClick={() => setShowConfirmTerminateModal(false)}
                buttonText={t('continue_activity')}
                width="50%"
              />
              <SmallButton
                iconName={terminateInProgress ? 'ot-spinner' : undefined}
                iconPlacement="startIcon"
                buttonType="alert"
                onClick={confirmTerminate}
                buttonText={t('terminate_activity')}
                width="50%"
                disabled={terminateInProgress}
              />
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <Modal>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing40}
            alignItems={ALIGN_CENTER}
            justifyContent={ALIGN_CENTER}
          >
            <Flex
              height="12.5rem"
              backgroundColor={COLORS.darkBlack20}
              borderRadius={BORDERS.borderRadiusSize3}
              flexDirection={DIRECTION_COLUMN}
              color={COLORS.darkBlack90}
              padding={SPACING.spacing24}
              alignItems={ALIGN_CENTER}
            >
              <Icon
                name="ot-alert"
                size="2.5rem"
                marginBottom={SPACING.spacing16}
              />
              <StyledText
                as="h4"
                marginBottom={SPACING.spacing4}
                fontWeight={TYPOGRAPHY.fontWeightBold}
              >
                {i18n.format(t('robot_is_busy'), 'capitalize')}
              </StyledText>
              <StyledText as="p" textAlign={TYPOGRAPHY.textAlignCenter}>
                {t('computer_in_app_is_controlling_robot')}
              </StyledText>
            </Flex>
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              onClick={() => setShowConfirmTerminateModal(true)}
            >
              {t('terminate')}
            </StyledText>
          </Flex>
        </Modal>
      )}
    </Portal>
  )
}
