import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  AnimationVideo,
  Flex,
  LegacyStyledText,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import detachProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_1.webm'
import detachProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_8.webm'
import detachProbe96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_96.webm'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'

import type { ReactNode } from 'react'
import type { ModuleSetupWizardRequiresPipetteStepProps } from './types'

const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export function DetachProbe(
  props: ModuleSetupWizardRequiresPipetteStepProps
): ReactNode {
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

  return (
    <GenericWizardTile
      header={i18n.format(t('detach_probe'), 'capitalize')}
      rightHandBody={
        <Flex height="13.25rem" paddingTop={SPACING.spacing4}>
          <AnimationVideo
            css={css`
              max-width: 100%;
              max-height: 100%;
            `}
          >
            <source src={pipetteDetachProbeVideoSource} />
          </AnimationVideo>
        </Flex>
      }
      bodyText={
        <LegacyStyledText css={BODY_STYLE}>
          {t('detach_probe_description')}
        </LegacyStyledText>
      }
      proceedButtonText={t('complete_calibration')}
      proceed={proceed}
      back={goBack}
    />
  )
}
