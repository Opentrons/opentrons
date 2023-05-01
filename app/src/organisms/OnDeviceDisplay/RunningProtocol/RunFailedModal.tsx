import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  BORDERS,
} from '@opentrons/components'
import { useStopRunMutation } from '@opentrons/react-api-client'
import { RunTimeCommand } from '@opentrons/shared-data'

import { StyledText } from '../../../atoms/text'
import { SmallButton } from '../../../atoms/buttons/OnDeviceDisplay'
import { Modal } from '../../../molecules/Modal/OnDeviceDisplay'

import type { ModalHeaderBaseProps } from '../../../molecules/Modal/OnDeviceDisplay/types'

interface RunError {
  id: string
  errorType: string
  createdAt: string
  detail: string
}

interface RunFailedModalProps {
  runId: string
  setShowRunFailedModal: (showRunFailedModal: boolean) => void
  failedStep?: number
  failedCommand?: RunTimeCommand
  errors?: RunError[]
}

export function RunFailedModal({
  runId,
  setShowRunFailedModal,
  failedStep,
  failedCommand,
  errors,
}: RunFailedModalProps): JSX.Element | null {
  const { t, i18n } = useTranslation(['run_details', 'shared'])
  const history = useHistory()
  const { stopRun } = useStopRunMutation()
  const [isCanceling, setIsCanceling] = React.useState(false)

  if (errors == null) return null
  const modalHeader: ModalHeaderBaseProps = {
    title: t('run_failed_modal_title'),
    iconName: 'ot-alert',
    iconColor: COLORS.white,
  }

  // Note (kj:04/12/2023) Error code hasn't been defined yet
  // for now we use run's errors data
  const errorName = errors[0].errorType
  const errorCode = 'error-1000'
  const errorMessages = errors.map((error: RunError) => error.detail)

  const handleClose = (): void => {
    setIsCanceling(true)
    setShowRunFailedModal(false)
    stopRun(runId, {
      onSuccess: () => {
        // ToDo do we need to track this event?
        // If need, runCancel or runFailure something
        // trackProtocolRunEvent({ name: 'runCancel' })
        history.push('/dashboard')
      },
      onError: () => {
        setIsCanceling(false)
      },
    })
  }
  return (
    <Modal
      header={modalHeader}
      modalSize="large"
      isError
      onOutsideClick={() => setShowRunFailedModal(false)}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        marginTop={SPACING.spacing6}
      >
        <StyledText
          fontSize={TYPOGRAPHY.fontSize22}
          lineHeight={TYPOGRAPHY.lineHeight28}
          fontWeight={TYPOGRAPHY.fontWeightBold}
        >
          {t('run_failed_modal_header', {
            errorName: errorName,
            errorCode: errorCode,
            count: failedStep,
          })}
        </StyledText>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize22}
          lineHeight={TYPOGRAPHY.lineHeight28}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {/* This will be added when we get a new error system */}
          {'Error message'}
        </StyledText>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          backgroundColor={COLORS.light_one}
          borderRadius={BORDERS.size_three}
          gridGap={SPACING.spacing3}
          padding={SPACING.spacing4}
          overflowY="scroll"
          maxHeight="7.75rem"
        >
          <StyledText
            fontSize={TYPOGRAPHY.fontSize20}
            lineHeight={TYPOGRAPHY.lineHeight24}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('run_failed_modal_body', {
              command: failedCommand,
            })}
          </StyledText>
          <StyledText
            fontSize={TYPOGRAPHY.fontSize20}
            lineHeight={TYPOGRAPHY.lineHeight24}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {errorMessages}
          </StyledText>
        </Flex>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize22}
          lineHeight={TYPOGRAPHY.lineHeight28}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {t('run_failed_modal_description')}
        </StyledText>
        <Flex marginTop="1.75rem">
          <SmallButton
            width="100%"
            buttonType="alert"
            buttonText={i18n.format(t('shared:close'), 'titleCase')}
            onClick={handleClose}
            disabled={isCanceling}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
