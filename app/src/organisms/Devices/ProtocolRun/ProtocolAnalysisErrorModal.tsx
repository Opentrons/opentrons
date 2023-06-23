import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  JUSTIFY_FLEX_END,
  SPACING,
  PrimaryButton,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { StyledText } from '../../../atoms/text'
import { LegacyModal } from '../../../molecules/LegacyModal'

import type { AnalysisError } from '@opentrons/shared-data'

interface ProtocolAnalysisErrorModalProps {
  displayName: string | null
  errors: AnalysisError[]
  onClose: React.MouseEventHandler<HTMLButtonElement>
  robotName: string
}

export function ProtocolAnalysisErrorModal({
  displayName,
  errors,
  onClose,
  robotName,
}: ProtocolAnalysisErrorModalProps): JSX.Element {
  const { t } = useTranslation(['run_details', 'shared'])

  return (
    <Portal level="top">
      <LegacyModal
        data-testid="ProtocolRunDetails_analysisErrorModal"
        type="error"
        title="Protocol analysis failure"
        onClose={onClose}
      >
        <StyledText as="p">
          {t('analysis_failure_on_robot', {
            protocolName: displayName,
            robotName,
          })}
        </StyledText>
        {errors?.map((error, index) => (
          <StyledText as="p" key={index} marginTop={SPACING.spacing16}>
            {error?.detail}
          </StyledText>
        ))}
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <PrimaryButton
            role="button"
            aria-label="close_analysis_error_modal"
            marginTop={SPACING.spacing16}
            padding={`${SPACING.spacing8} ${SPACING.spacing48}`}
            onClick={onClose}
          >
            <StyledText
              css={TYPOGRAPHY.pSemiBold}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
            >
              {t('shared:close')}
            </StyledText>
          </PrimaryButton>
        </Flex>
      </LegacyModal>
    </Portal>
  )
}
