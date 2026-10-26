import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/components/ODD/buttons'
import { OddModal } from '/app/components/ODD/modals/OddModal'
import { useCloseCurrentRun } from '/app/resources/runs'

import type { ReactNode } from 'react'
import type { OddModalHeaderBaseProps } from '/app/components/ODD/modals/OddModal/types'

interface AnalysisFailedModalProps {
  errors: string[]
  protocolId: string | null
  runId: string
  setShowAnalysisFailedModal: (showAnalysisFailedModal: boolean) => void
}

export function AnalysisFailedModal({
  errors,
  protocolId,
  setShowAnalysisFailedModal,
}: AnalysisFailedModalProps): ReactNode {
  const { t } = useTranslation('protocol_setup')
  const navigate = useNavigate()
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('protocol_analysis_failed'),
    iconName: 'information',
    iconColor: COLORS.black90,
    hasExitIcon: true,
  }

  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()

  const handleRestartSetup = (): void => {
    closeCurrentRun({
      onSuccess: () => {
        navigate(protocolId != null ? `/protocols/${protocolId}` : '/protocols')
      },
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
          <StyledText forwardedAs="p">{t('with_the_chosen_value')}</StyledText>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            borderRadius={BORDERS.borderRadius8}
            backgroundColor={COLORS.grey35}
            padding={`${SPACING.spacing16} ${SPACING.spacing20}`}
            overflowY="auto"
          >
            {errors.map((error, index) => (
              <StyledText key={index} forwardedAs="p">
                {error}
              </StyledText>
            ))}
          </Flex>
          <StyledText forwardedAs="p">{t('restart_setup_and_try')}</StyledText>
        </Flex>
        <SmallButton
          onClick={handleRestartSetup}
          buttonText={t('restart_setup')}
          buttonType="alert"
          iconName={isClosingCurrentRun ? 'ot-spinner' : null}
          iconPlacement="startIcon"
          disabled={isClosingCurrentRun}
        />
      </Flex>
    </OddModal>
  )
}
