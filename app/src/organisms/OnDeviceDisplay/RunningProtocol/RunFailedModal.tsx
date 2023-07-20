import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
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

interface RunError {
  id: string
  errorType: string
  createdAt: string
  detail: string
}

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

  if (errors == null) return null
  const modalHeader: ModalHeaderBaseProps = {
    title: t('run_failed_modal_title'),
  }

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
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing40}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing16}
          alignItems={ALIGN_FLEX_START}
        >
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('error_type', {
              errorType: errors[0].errorType,
            })}
          </StyledText>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            maxHeight="11rem"
            backgroundColor={COLORS.light1}
            borderRadius={BORDERS.borderRadiusSize3}
            padding={`${SPACING.spacing16} ${SPACING.spacing20}`}
          >
            <Flex css={SCROLL_BAR_STYLE}>
              {errors?.map(error => (
                <StyledText
                  as="p"
                  key={error.id}
                  textAlign={TYPOGRAPHY.textAlignLeft}
                >
                  {error.detail}
                </StyledText>
              ))}
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
