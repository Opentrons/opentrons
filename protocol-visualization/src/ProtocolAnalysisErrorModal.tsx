import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  Modal,
  OVERFLOW_WRAP_ANYWHERE,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { AnalysisError } from '@opentrons/shared-data'

interface ProtocolAnalysisErrorModalProps {
  errors: AnalysisError[]
  onClose: () => void
  portalRoot?: HTMLElement | null
}

export function ProtocolAnalysisErrorModal({
  errors,
  onClose,
  portalRoot,
}: ProtocolAnalysisErrorModalProps): JSX.Element {
  const { t, i18n } = useTranslation(['protocol_visualization', 'shared'])

  return (
    <Modal type="error" title="Protocol analysis failure" onClose={onClose}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        {errors.map((error, index) => (
          <StyledText
            key={`error-${index}`}
            desktopStyle="bodyDefaultRegular"
            overflowWrap={OVERFLOW_WRAP_ANYWHERE}
          >
            {error?.detail}
          </StyledText>
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
    </Modal>
  )
}
