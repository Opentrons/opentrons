import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import isEmpty from 'lodash/isEmpty'
import { css } from 'styled-components'

import {
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_AUTO,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { StyledText } from '../../../atoms/text'
import { SmallButton } from '../../../atoms/buttons'
import { Modal } from '../../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../../molecules/Modal/types'
import type { RunError } from '@opentrons/api-client'

interface RunFailedModalProps {
  runId: string
  setShowRunFailedModal: (showRunFailedModal: boolean) => void
  errors?: RunError[]
}

export function RunFailedModal({
  runId,
  setShowRunFailedModal,
  errors,
}: RunFailedModalProps): JSX.Element | null {
  const { t, i18n } = useTranslation(['run_details', 'shared'])
  const history = useHistory()
  const { stopRun } = useStopRunMutation()
  const [isCanceling, setIsCanceling] = React.useState(false)

  if (errors == null || errors.length === 0) return null
  const modalHeader: ModalHeaderBaseProps = {
    title: t('run_failed_modal_title'),
  }

  const highestPriorityError = getHighestPriorityError(errors)

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
      onOutsideClick={() => setShowRunFailedModal(false)}
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
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('error_info', {
              errorType: highestPriorityError.errorType,
              errorCode: highestPriorityError.errorCode,
            })}
          </StyledText>
          <Flex
            width="100%"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            maxHeight="11rem"
            backgroundColor={COLORS.light1}
            borderRadius={BORDERS.borderRadiusSize3}
            padding={`${SPACING.spacing16} ${SPACING.spacing20}`}
          >
            <Flex flexDirection={DIRECTION_COLUMN} css={SCROLL_BAR_STYLE}>
              <StyledText as="p" textAlign={TYPOGRAPHY.textAlignLeft}>
                {highestPriorityError.detail}
              </StyledText>
              {!isEmpty(highestPriorityError.errorInfo) && (
                <StyledText as="p" textAlign={TYPOGRAPHY.textAlignLeft}>
                  {JSON.stringify(highestPriorityError.errorInfo)}
                </StyledText>
              )}
            </Flex>
          </Flex>
          <StyledText as="p" textAlign={TYPOGRAPHY.textAlignLeft}>
            {t('contact_information')}
          </StyledText>
        </Flex>
        <SmallButton
          width="100%"
          buttonType="alert"
          buttonText={i18n.format(t('shared:close'), 'capitalize')}
          onClick={handleClose}
          disabled={isCanceling}
        />
      </Flex>
    </Modal>
  )
}

const SCROLL_BAR_STYLE = css`
  overflow-y: ${OVERFLOW_AUTO};

  &::-webkit-scrollbar {
    width: 0.75rem;
    background-color: ${COLORS.light1};
  }

  &::-webkit-scrollbar-track {
    margin-top: ${SPACING.spacing16};
    margin-bottom: ${SPACING.spacing16};
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.darkBlack40};
    border-radius: 11px;
  }
`

const _getHighestPriorityError = (error: RunError): RunError => {
  if (
    error == null ||
    error.wrappedErrors == null ||
    error.wrappedErrors.length === 0
  ) {
    return error
  }

  let highestPriorityError = error

  error.wrappedErrors.forEach(wrappedError => {
    const e = _getHighestPriorityError(wrappedError)
    const isHigherPriority = _getIsHigherPriority(
      e.errorCode,
      highestPriorityError.errorCode
    )
    if (isHigherPriority) {
      highestPriorityError = e
    }
  })
  return highestPriorityError
}

/**
 * returns true if the first error code is higher priority than the second, false otherwise
 */
const _getIsHigherPriority = (
  errorCode1: string,
  errorCode2: string
): boolean => {
  const errorNumber1 = Number(errorCode1)
  const errorNumber2 = Number(errorCode2)

  const isSameCategory =
    Math.floor(errorNumber1 / 1000) === Math.floor(errorNumber2 / 1000)
  const isCode1GenericError = errorNumber1 % 1000 === 0

  let isHigherPriority = null

  if (
    (isSameCategory && !isCode1GenericError) ||
    (!isSameCategory && errorNumber1 < errorNumber2)
  ) {
    isHigherPriority = true
  } else {
    isHigherPriority = false
  }

  return isHigherPriority
}

export const getHighestPriorityError = (errors: RunError[]): RunError => {
  const highestFirstWrappedError = _getHighestPriorityError(errors[0])
  return [highestFirstWrappedError, ...errors.slice(1)].reduce((acc, val) => {
    const e = _getHighestPriorityError(val)
    const isHigherPriority = _getIsHigherPriority(e.errorCode, acc.errorCode)
    if (isHigherPriority) {
      return e
    }
    return acc
  })
}
