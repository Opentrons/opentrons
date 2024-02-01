import * as React from 'react'
import { css } from 'styled-components'
import detachProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_1.webm'
import detachProbe8 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_8.webm'
import detachProbe96 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_96.webm'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'

import type { ModuleCalibrationWizardStepProps } from './types'

const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export const DetachProbe = (
  props: ModuleCalibrationWizardStepProps
): JSX.Element | null => {
  const { attachedPipette, proceed, goBack } = props
  const { t, i18n } = useTranslation('module_wizard_flows')

  const pipetteChannels = attachedPipette.data.channels
  let pipetteDetachProbeVideoSource
  switch (pipetteChannels) {
    case 1:
      pipetteDetachProbeVideoSource = detachProbe1
      break
    case 8:
      pipetteDetachProbeVideoSource = detachProbe8
      break
    case 96:
      pipetteDetachProbeVideoSource = detachProbe96
      break
  }

  const pipetteDetachProbeVid = (
    <Flex height="13.25rem" paddingTop={SPACING.spacing4}>
      <video
        css={css`
          max-width: 100%;
          max-height: 100%;
        `}
        autoPlay={true}
        loop={true}
        controls={false}
      >
        <source src={pipetteDetachProbeVideoSource} />
      </video>
    </Flex>
  )

  const bodyText = (
    <StyledText css={BODY_STYLE}>{t('detach_probe_description')}</StyledText>
  )

  return (
    <GenericWizardTile
      header={i18n.format(t('detach_probe'), 'capitalize')}
      rightHandBody={pipetteDetachProbeVid}
      bodyText={bodyText}
      proceedButtonText={t('complete_calibration')}
      proceed={proceed}
      back={goBack}
    />
  )
}
