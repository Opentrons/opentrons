import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import pipetteProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'

import type { ModuleCalibrationWizardStepProps } from './types'

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export const AttachProbe = (
  props: ModuleCalibrationWizardStepProps
): JSX.Element | null => {
  const { proceed, goBack } = props
  const { t } = useTranslation('module_wizard_flows')

  const handleOnClick = (): void => {
    // TODO: send calibration/calibrateModule command here
    proceed()
  }

  const pipetteProbeVid = (
    <Flex height="13.25rem" paddingTop={SPACING.spacing4}>
      <video
        css={css`
          max-width: 100%;
          max-height: 100%;
        `}
        autoPlay={true}
        loop={true}
        controls={false}
        data-testid={pipetteProbe1}
      >
        <source src={pipetteProbe1} />
      </video>
    </Flex>
  )

  const bodyText = (
    <StyledText css={BODY_STYLE}>{t('calibration_probe')}</StyledText>
  )

  // TODO: add calibration loading screen and error screen
  return (
    <GenericWizardTile
      header={t('attach_probe')}
      // TODO: make sure this is the right animation
      rightHandBody={pipetteProbeVid}
      bodyText={bodyText}
      proceedButtonText={t('begin_calibration')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
