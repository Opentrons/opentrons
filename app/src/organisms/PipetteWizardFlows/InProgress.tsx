import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { TYPOGRAPHY, SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import pipetteCalibrating from '../../assets/images/change-pip/pipette-is-calibrating.png'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { FLOWS, SECTIONS } from './constants'
import type { PipetteWizardStep, PipetteWizardStepProps } from './types'

interface InProgressProps extends PipetteWizardStepProps {
  currentStepSection: PipetteWizardStep['section']
}
export function InProgress(props: InProgressProps): JSX.Element {
  const { currentStepSection, flowType } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const pipetteCalibratingImage = (
    <img src={pipetteCalibrating} alt="Pipette is calibrating" />
  )
  return currentStepSection === SECTIONS.ATTACH_STEM &&
    flowType === FLOWS.CALIBRATE ? (
    <InProgressModal alternativeSpinner={pipetteCalibratingImage}>
      <StyledText
        css={TYPOGRAPHY.h1Default}
        marginTop={SPACING.spacing5}
        marginBottom={SPACING.spacing3}
      >
        {t('pipette_calibrating')}
      </StyledText>
    </InProgressModal>
  ) : (
    <InProgressModal>
      <StyledText
        css={TYPOGRAPHY.h1Default}
        marginTop={SPACING.spacing5}
        marginBottom={SPACING.spacing3}
      >
        {t('stand_back')}
      </StyledText>
    </InProgressModal>
  )
}
