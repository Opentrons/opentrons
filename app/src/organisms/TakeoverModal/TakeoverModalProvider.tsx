import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Portal } from '../../App/portal'
import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal/OnDeviceDisplay'
import { TakeoverModalContext } from './TakeoverModalContext'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/OnDeviceDisplay/types'
import { useCurrentMaintenanceRun } from '@opentrons/react-api-client'

interface TakeoverModalProps {
  children: React.ReactNode
}
export function TakeoverModalProvider(props: TakeoverModalProps): JSX.Element {
  const { i18n, t } = useTranslation('shared')
  const [
    isMaintanenceInProgress,
    setIsMaintenanceInProgress,
  ] = React.useState<boolean>(false)
  const isMaintanenceRunCurrent =
    useCurrentMaintenanceRun({
      refetchInterval: 5000,
    }).data?.data.id != null

  const [isConfirmTerminate, setConfirmTerminate] = React.useState<boolean>(
    false
  )
  const [closeAndTerminate, setCloseAndTerminate] = React.useState<boolean>(
    false
  )
  function setMaintenanceInProgress(value: boolean): void {
    setIsMaintenanceInProgress(value)
  }

  const handleCloseAndTerminate = (): void => {
    setCloseAndTerminate(true)
    setIsMaintenanceInProgress(false)
  }

  const terminateHeader: ModalHeaderBaseProps = {
    title: t('terminate_activity') + '?',
    iconName: 'information',
    iconColor: COLORS.yellow2,
  }

  console.log(isMaintanenceRunCurrent)
  return (
    <TakeoverModalContext.Provider
      value={{
        isMaintanenceInProgress,
        setMaintenanceInProgress,
        closeAndTerminate,
      }}
    >
      {!isMaintanenceInProgress && isMaintanenceRunCurrent && (
        <Portal level="top">
          {isConfirmTerminate ? (
            <Modal header={terminateHeader}>
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText as="p" marginBottom={SPACING.spacing40}>
                  {t('confirm_terminate')}
                </StyledText>
                <Flex
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  gridGap={SPACING.spacing4}
                >
                  <SmallButton
                    buttonType="primary"
                    onClick={() => setConfirmTerminate(false)}
                    buttonText={t('continue_activity')}
                    width="50%"
                  />
                  <SmallButton
                    buttonType="alert"
                    onClick={() => handleCloseAndTerminate()}
                    buttonText={t('terminate_activity')}
                    width="50%"
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
                  borderRadius={BORDERS.size3}
                  flexDirection={DIRECTION_COLUMN}
                  color={COLORS.darkBlack90}
                  padding={SPACING.spacing24}
                  alignItems={ALIGN_CENTER}
                >
                  <Icon
                    name="information"
                    size="2.5rem"
                    marginBottom={SPACING.spacing16}
                  />
                  <StyledText
                    as="h4"
                    marginBottom={SPACING.spacing4}
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  >
                    {i18n.format(t('robot_is_busy'), 'capitalize')}
                  </StyledText>
                  <StyledText
                    as="p"
                    fontWeight={TYPOGRAPHY.fontWeightLight}
                    textAlign={TYPOGRAPHY.textAlignCenter}
                  >
                    {t('computer_in_app_is_controlling_robot')}
                  </StyledText>
                </Flex>
                <StyledText as="p" onClick={() => setConfirmTerminate(true)}>
                  {i18n.format(t('terminate'), 'capitalize')}
                </StyledText>
              </Flex>
            </Modal>
          )}
        </Portal>
      )}
      {props.children}
    </TakeoverModalContext.Provider>
  )
}
