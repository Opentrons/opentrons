import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  JUSTIFY_FLEX_END,
  OVERFLOW_WRAP_ANYWHERE,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  Modal,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { useProtocolAnalysisErrors } from '/app/resources/runs'

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
  displayName: string | null
  errors: AnalysisError[]
  onClose: () => void
  robotName: string
}

export function ProtocolAnalysisErrorModal({
  displayName,
  errors,
  onClose,
  robotName,
}: ProtocolAnalysisErrorModalProps): JSX.Element {
  const { t } = useTranslation(['run_details', 'shared'])

  return createPortal(
    <Modal
      data-testid="ProtocolRunDetails_analysisErrorModal"
      type="error"
      title="Protocol analysis failure"
      onClose={onClose}
    >
      <LegacyStyledText as="p" overflowWrap={OVERFLOW_WRAP_ANYWHERE}>
        {t('analysis_failure_on_robot', {
          protocolName: displayName,
          robotName,
        })}
      </LegacyStyledText>
      {errors?.map((error, index) => (
        <LegacyStyledText as="p" key={index} marginTop={SPACING.spacing16}>
          {error?.detail}
        </LegacyStyledText>
      ))}
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <PrimaryButton
          role="button"
          aria-label="close_analysis_error_modal"
          marginTop={SPACING.spacing16}
          padding={`${SPACING.spacing8} ${SPACING.spacing48}`}
          onClick={onClose}
        >
          <LegacyStyledText
            css={TYPOGRAPHY.pSemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('shared:close')}
          </LegacyStyledText>
        </PrimaryButton>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
