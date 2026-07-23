import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'
import { useDismissCurrentRunMutation } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { OddModal } from '/app/molecules/OddModal'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface AnalysisFailedModalProps {
  errors: string[]
  protocolId: string | null
  runId: string
  setShowAnalysisFailedModal: (showAnalysisFailedModal: boolean) => void
}

export function AnalysisFailedModal({
  errors,
  protocolId,
  runId,
  setShowAnalysisFailedModal,
}: AnalysisFailedModalProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const navigate = useNavigate()
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('protocol_analysis_failed'),
    iconName: 'information',
    iconColor: COLORS.black90,
    hasExitIcon: true,
  }

  const documentationState = useDocumentationState()
  const { isLoading: isDismissing, mutateAsync: dismissCurrentRunAsync } =
    useDismissCurrentRunMutation(documentationState)

  const handleRestartSetup = (): void => {
    dismissCurrentRunAsync(runId).then(() => {
      navigate(protocolId != null ? `/protocols/${protocolId}` : '/protocols')
    })
  }

  return (
    <OddModal
      header={modalHeader}
      onOutsideClick={() => {
        setShowAnalysisFailedModal(false)
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <LegacyStyledText forwardedAs="p">
            {t('with_the_chosen_value')}
          </LegacyStyledText>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            borderRadius={BORDERS.borderRadius8}
            backgroundColor={COLORS.grey35}
            padding={`${SPACING.spacing16} ${SPACING.spacing20}`}
            overflowY="auto"
          >
            {errors.map((error, index) => (
              <LegacyStyledText key={index} forwardedAs="p">
                {error}
              </LegacyStyledText>
            ))}
          </Flex>
          <LegacyStyledText forwardedAs="p">
            {t('restart_setup_and_try')}
          </LegacyStyledText>
        </Flex>
        <SmallButton
          onClick={handleRestartSetup}
          buttonText={t('restart_setup')}
          buttonType="alert"
          iconName={isDismissing ? 'ot-spinner' : null}
          iconPlacement="startIcon"
          disabled={isDismissing}
        />
      </Flex>
    </OddModal>
  )
}
