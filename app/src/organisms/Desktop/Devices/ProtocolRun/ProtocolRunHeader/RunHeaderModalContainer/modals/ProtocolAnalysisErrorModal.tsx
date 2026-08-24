import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  CodeBlock,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  Modal,
  OVERFLOW_WRAP_ANYWHERE,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { useProtocolAnalysisErrors } from '/app/resources/runs'

import type { ReactNode } from 'react'
import type { AnalysisError } from '@opentrons/shared-data'

export type UseAnalysisErrorsModalProps = Omit<
  ProtocolAnalysisErrorModalProps,
  'errors' | 'onClose'
> & { runId: string | null }

export type UseAnalysisErrorsModalResult =
  | { showModal: false; modalProps: null }
  | { showModal: true; modalProps: ProtocolAnalysisErrorModalProps }

// Provides validated modal props. Implicitly set the modal to true if analysis errors are present.
export function useProtocolAnalysisErrorsModal({
  robotName,
  displayName,
  runId,
}: UseAnalysisErrorsModalProps): UseAnalysisErrorsModalResult {
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (analysisErrors != null && analysisErrors?.length > 0) {
      setShowModal(true)
    }
  }, [analysisErrors])

  const toggleModal = (): void => {
    setShowModal(false)
  }

  return showModal && analysisErrors != null && analysisErrors.length > 0
    ? {
        showModal: true,
        modalProps: {
          onClose: toggleModal,
          errors: analysisErrors,
          robotName,
          displayName,
        },
      }
    : { showModal: false, modalProps: null }
}

export interface ProtocolAnalysisErrorModalProps {
  errors: AnalysisError[]
  onClose: () => void
  displayName?: string | null
  robotName?: string
}

export function ProtocolAnalysisErrorModal({
  errors,
  onClose,
  robotName,
  displayName,
}: ProtocolAnalysisErrorModalProps): ReactNode {
  const { t, i18n } = useTranslation(['run_details', 'shared'])

  return createPortal(
    <Modal
      data-testid="ProtocolRunDetails_analysisErrorModal"
      type="error"
      title="Protocol analysis failure"
      onClose={onClose}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        {robotName == null && displayName == null ? null : (
          <StyledText
            desktopStyle="bodyDefaultRegular"
            overflowWrap={OVERFLOW_WRAP_ANYWHERE}
          >
            {t('analysis_failure_on_robot', {
              protocolName: displayName,
              robotName,
            })}
          </StyledText>
        )}
        {errors.map((error, index) => (
          <CodeBlock key={`error-${index}`}>{error?.detail}</CodeBlock>
        ))}
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <PrimaryButton
          role="button"
          aria-label="close_analysis_error_modal"
          marginTop={SPACING.spacing16}
          padding={`${SPACING.spacing8} ${SPACING.spacing48}`}
          onClick={onClose}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {i18n.format(t('shared:close'), 'capitalize')}
          </StyledText>
        </PrimaryButton>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
