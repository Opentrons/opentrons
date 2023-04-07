import * as React from 'react'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import { css } from 'styled-components'
import { FLOWS, SECTIONS } from './constants'

// TODO(jr, 4/6/23): upload correct animations for attach left 1 & 8 channel loop and
//  attach right 1 & 8 channel loop
import attachLeft18 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_1_L.webm'
import attachRight18 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_1_R.webm'
import detachLeft1 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_1_L.webm'
import detachRight1 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_1_R.webm'
import detachLeft8 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_8_L.webm'
import detachRight8 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_8_R.webm'
import attachProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import attachProbe8 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_8.webm'
import detachProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_1.webm'
import detachProbe8 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_8.webm'

import type { AttachedPipettesByMount } from '@opentrons/api-client'
import type { PipetteWizardStep } from './types'

export function getIsGantryEmpty(
  attachedPipette: AttachedPipettesByMount
): boolean {
  return attachedPipette[LEFT] == null && attachedPipette[RIGHT] == null
}

interface PipetteAnimationProps {
  pipetteWizardStep: PipetteWizardStep
  channel?: 1 | 8
}
export function getPipetteAnimations(
  props: PipetteAnimationProps
): JSX.Element {
  const { pipetteWizardStep, channel } = props
  const { mount, flowType, section } = pipetteWizardStep

  let sourcePipette
  if (flowType === FLOWS.DETACH || section === SECTIONS.DETACH_PIPETTE) {
    if (mount === LEFT && channel === 1) {
      sourcePipette = detachLeft1
    } else if (mount === LEFT && channel === 8) {
      sourcePipette = detachLeft8
    } else if (mount === RIGHT && channel === 1) {
      sourcePipette = detachRight1
    } else if (mount === RIGHT && channel === 8) {
      sourcePipette = detachRight8
    }
  } else if (flowType === FLOWS.ATTACH) {
    if (mount === LEFT) {
      sourcePipette = attachLeft18
    } else if (mount === RIGHT) {
      sourcePipette = attachRight18
    }
  }

  let sourceProbe
  if (section === SECTIONS.ATTACH_PROBE && channel === 1) {
    sourceProbe = attachProbe1
  } else if (section === SECTIONS.DETACH_PROBE && channel === 1) {
    sourceProbe = detachProbe1
  } else if (section === SECTIONS.ATTACH_PROBE && channel === 8) {
    sourceProbe = attachProbe8
  } else if (section === SECTIONS.DETACH_PROBE && channel === 8) {
    sourceProbe = detachProbe8
  }

  return (
    <video
      css={css`
        max-width: 100%;
        max-height: ${section === SECTIONS.ATTACH_PROBE ||
        section === SECTIONS.DETACH_PROBE
          ? `20rem`
          : `12rem`};
      `}
      autoPlay={true}
      loop={true}
      controls={false}
      data-testid={
        section === SECTIONS.ATTACH_PROBE || section === SECTIONS.DETACH_PROBE
          ? sourceProbe
          : sourcePipette
      }
    >
      <source
        src={
          section === SECTIONS.ATTACH_PROBE || section === SECTIONS.DETACH_PROBE
            ? sourceProbe
            : sourcePipette
        }
      />
    </video>
  )
}
