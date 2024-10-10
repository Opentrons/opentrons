import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { css } from 'styled-components'

import {
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_AUTO,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import { getHighestPriorityError } from '/app/transformations/runs'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'
import type {
  RunCommandErrors,
  RunError,
  RunStatus,
} from '@opentrons/api-client'
import type { RunCommandError } from '@opentrons/shared-data'

interface RunFailedModalProps {
  runId: string
  setShowRunFailedModal: (showRunFailedModal: boolean) => void
  errors?: RunError[]
  commandErrorList?: RunCommandErrors
  runStatus: RunStatus | null
}

export function RunFailedModal({
  runId,
  setShowRunFailedModal,
  errors,
  commandErrorList,
  runStatus,
}: RunFailedModalProps): JSX.Element | null {
  const { t, i18n } = useTranslation(['run_details', 'shared', 'branded'])
  const navigate = useNavigate()
  const { stopRun } = useStopRunMutation()
  const [isCanceling, setIsCanceling] = useState(false)

  if (
    (errors == null || errors.length === 0) &&
    (commandErrorList == null || commandErrorList.data.length === 0)
  )
    return null
  const modalHeader: OddModalHeaderBaseProps = {
    title:
      commandErrorList == null || commandErrorList?.data.length === 0
        ? t('run_failed_modal_title')
        : runStatus === RUN_STATUS_SUCCEEDED
        ? t('warning_details')
        : t('error_details'),
  }

  const highestPriorityError = getHighestPriorityError(errors ?? [])

  const handleClose = (): void => {
    setIsCanceling(true)
    setShowRunFailedModal(false)
    stopRun(runId, {
      onSuccess: () => {
        // ToDo do we need to track this event?
        // If need, runCancel or runFailure something
        // trackProtocolRunEvent({ name: 'runCancel' })
        navigate('/dashboard')
      },
      onError: () => {
        setIsCanceling(false)
      },
    })
  }

  interface ErrorContentProps {
    errors: RunCommandError[]
    isSingleError: boolean
  }
  const ErrorContent = ({
    errors,
    isSingleError,
  }: ErrorContentProps): JSX.Element => {
    return (
      <>
        <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {isSingleError
            ? t('error_info', {
                errorType: errors[0].errorType,
                errorCode: errors[0].errorCode,
              })
            : runStatus === RUN_STATUS_SUCCEEDED
            ? t(errors.length > 1 ? 'no_of_warnings' : 'no_of_warning', {
                count: errors.length,
              })
            : t(errors.length > 1 ? 'no_of_errors' : 'no_of_error', {
                count: errors.length,
              })}
        </LegacyStyledText>
        <Flex
          width="100%"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          maxHeight="11rem"
          backgroundColor={COLORS.grey35}
          borderRadius={BORDERS.borderRadius8}
          padding={`${SPACING.spacing16} ${SPACING.spacing20}`}
        >
          <Flex flexDirection={DIRECTION_COLUMN} css={SCROLL_BAR_STYLE}>
            {' '}
            {errors.map((error, index) => (
              <LegacyStyledText
                as="p"
                textAlign={TYPOGRAPHY.textAlignLeft}
                key={index}
              >
                {' '}
                {isSingleError
                  ? error.detail
                  : `${error.errorCode}: ${error.detail}`}
              </LegacyStyledText>
            ))}
          </Flex>
        </Flex>
      </>
    )
  }

  return (
    <OddModal
      header={modalHeader}
      onOutsideClick={() => {
        setShowRunFailedModal(false)
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing40}
        width="100%"
        css={css`
          word-break: break-all;
        `}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing16}
          alignItems={ALIGN_FLEX_START}
        >
          <ErrorContent
            errors={
              highestPriorityError
                ? [highestPriorityError]
                : commandErrorList?.data && commandErrorList?.data.length > 0
                ? commandErrorList?.data
                : []
            }
            isSingleError={!!highestPriorityError}
          />
        </Flex>
        <LegacyStyledText
          as="p"
          textAlign={TYPOGRAPHY.textAlignLeft}
          css={css`
            word-break: break-word;
          `}
        >
          {t('branded:contact_information')}
        </LegacyStyledText>
        <SmallButton
          width="100%"
          buttonType="alert"
          buttonText={i18n.format(t('shared:close'), 'capitalize')}
          onClick={handleClose}
          disabled={isCanceling}
        />
      </Flex>
    </OddModal>
  )
}

const SCROLL_BAR_STYLE = css`
  overflow-y: ${OVERFLOW_AUTO};

  &::-webkit-scrollbar {
    width: 0.75rem;
    background-color: ${COLORS.grey35};
  }

  &::-webkit-scrollbar-track {
    margin-top: ${SPACING.spacing16};
    margin-bottom: ${SPACING.spacing16};
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.grey50};
    border-radius: 11px;
  }
`
