import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { TYPOGRAPHY, SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import pipetteCalibrating from '../../assets/images/change-pip/pipette-is-calibrating.png'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'

export function CalibrationInProgress(): JSX.Element {
  const { t } = useTranslation('pipette_wizard_flows')
  const pipetteCalibratingImage = (
    <img src={pipetteCalibrating} alt="Pipette is calibrating" />
  )
  return (
    <InProgressModal alternativeSpinner={pipetteCalibratingImage}>
      <StyledText
        css={TYPOGRAPHY.h1Default}
        marginTop={SPACING.spacing5}
        marginBottom={SPACING.spacing3}
      >
        {t('pipette_calibrating')}
      </StyledText>
    </InProgressModal>
  )
}
