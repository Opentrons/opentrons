import * as React from 'react'
import { css } from 'styled-components'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import { SPACING } from '@opentrons/components'
import { FLOWS, SECTIONS } from './constants'

import attachLeft18 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_1_8_L.webm'
import attachRight18 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_1_8_R.webm'
import detachLeft1 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_1_L.webm'
import detachRight1 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_1_R.webm'
import detachLeft8 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_8_L.webm'
import detachRight8 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_8_R.webm'
import attachProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import attachProbe8 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_8.webm'
import detachProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_1.webm'
import detachProbe8 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_8.webm'

import attach96 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_96.webm'
import attachPlate96 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_Plate_96.webm'
import detach96 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_96.webm'
import detachPlate96 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Plate_96.webm'
import zAxisAttach96 from '../../assets/videos/pipette-wizard-flows/Pipette_Zaxis_Attach_96.webm'
import zAxisDetach96 from '../../assets/videos/pipette-wizard-flows/Pipette_Zaxis_Detach_96.webm'

import type { AttachedPipettesFromInstrumentsQuery } from '../Devices/hooks'
import type { PipetteWizardFlow, PipetteWizardStep } from './types'

export function getIsGantryEmpty(
  attachedPipette: AttachedPipettesFromInstrumentsQuery
): boolean {
  return attachedPipette[LEFT] == null && attachedPipette[RIGHT] == null
}

interface PipetteAnimationProps {
  pipetteWizardStep: PipetteWizardStep
  channel?: number
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
        padding-top: ${SPACING.spacing4};
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

interface PipetteAnimation96Props {
  section: PipetteWizardStep['section']
  flowType: PipetteWizardFlow
}
export function getPipetteAnimations96(
  props: PipetteAnimation96Props
): JSX.Element {
  const { section, flowType } = props

  let src = 'unknown src'
  if (section === SECTIONS.MOUNT_PIPETTE) {
    src = attach96
  } else if (section === SECTIONS.MOUNTING_PLATE) {
    src = flowType === FLOWS.ATTACH ? attachPlate96 : detachPlate96
  } else if (section === SECTIONS.DETACH_PIPETTE) {
    src = detach96
  } else if (section === SECTIONS.CARRIAGE)
    src = flowType === FLOWS.ATTACH ? zAxisAttach96 : zAxisDetach96
  //  todo(jr, 5/30/23):add the detach/attach probe assets when they're final!
  // } else if (section === SECTIONS.ATTACH_PROBE) {
  //   src =
  // } else if (section === SECTIONS.DETACH_PROBE) {
  //   src =
  // }

  return (
    <video
      css={css`
        padding-top: ${SPACING.spacing4};
        max-width: 100%;
        max-height: 12rem;
      `}
      autoPlay={true}
      loop={true}
      controls={false}
      data-testid={src}
    >
      <source src={src} />
    </video>
  )
}
