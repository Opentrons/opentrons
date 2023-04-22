import { render, screen } from '@testing-library/react'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { getIsGantryEmpty, getPipetteAnimations } from '../utils'
import { FLOWS, SECTIONS } from '../constants'

import type { AttachedPipette } from '../../../redux/pipettes/types'

const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}

describe('getIsGantryEmpty', () => {
  it('should return true when no pipettes attached', () => {
    expect(getIsGantryEmpty({ left: null, right: null })).toEqual(true)
  })
  it('should return false when 1 pipette is attached', () => {
    expect(getIsGantryEmpty({ left: mockPipette, right: null })).toEqual(false)
  })
  it('should return false when 2 pipettes are attached', () => {
    expect(getIsGantryEmpty({ left: mockPipette, right: mockPipette })).toEqual(
      false
    )
  })
})

describe('getPipetteAnimations', () => {
  it('should return correct video for detach left 1', () => {
    const mockPipetteWizardStep = {
      mount: LEFT,
      flowType: FLOWS.DETACH,
      section: SECTIONS.DETACH_PIPETTE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
        channel: 1,
      })
    )
    screen.getByTestId('Pipette_Detach_1_L.webm')
  })
  it('should return correct video for detach left 8', () => {
    const mockPipetteWizardStep = {
      mount: LEFT,
      flowType: FLOWS.DETACH,
      section: SECTIONS.DETACH_PIPETTE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
        channel: 8,
      })
    )
    screen.getByTestId('Pipette_Detach_8_L.webm')
  })
  it('should return correct video for detach right 1', () => {
    const mockPipetteWizardStep = {
      mount: RIGHT,
      flowType: FLOWS.DETACH,
      section: SECTIONS.DETACH_PIPETTE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
        channel: 1,
      })
    )
    screen.getByTestId('Pipette_Detach_1_R.webm')
  })
  it('should return correct video for detach right 8', () => {
    const mockPipetteWizardStep = {
      mount: RIGHT,
      flowType: FLOWS.DETACH,
      section: SECTIONS.DETACH_PIPETTE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
        channel: 8,
      })
    )
    screen.getByTestId('Pipette_Detach_8_R.webm')
  })
  it('should return correct video for attach probe 1', () => {
    const mockPipetteWizardStep = {
      mount: RIGHT,
      flowType: FLOWS.ATTACH,
      section: SECTIONS.ATTACH_PROBE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
        channel: 1,
      })
    )
    screen.getByTestId('Pipette_Attach_Probe_1.webm')
  })
  it('should return correct video for attach probe 8', () => {
    const mockPipetteWizardStep = {
      mount: RIGHT,
      flowType: FLOWS.ATTACH,
      section: SECTIONS.ATTACH_PROBE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
        channel: 8,
      })
    )
    screen.getByTestId('Pipette_Attach_Probe_8.webm')
  })
  it('should return correct video for detach probe 1', () => {
    const mockPipetteWizardStep = {
      mount: RIGHT,
      flowType: FLOWS.ATTACH,
      section: SECTIONS.DETACH_PROBE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
        channel: 1,
      })
    )
    screen.getByTestId('Pipette_Detach_Probe_1.webm')
  })
  it('should return correct video for detach probe 8', () => {
    const mockPipetteWizardStep = {
      mount: RIGHT,
      flowType: FLOWS.ATTACH,
      section: SECTIONS.DETACH_PROBE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
        channel: 8,
      })
    )
    screen.getByTestId('Pipette_Detach_Probe_8.webm')
  })
  it('should return correct video for attach left 1', () => {
    const mockPipetteWizardStep = {
      mount: LEFT,
      flowType: FLOWS.ATTACH,
      section: SECTIONS.MOUNT_PIPETTE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
      })
    )
    screen.getByTestId('Pipette_Attach_1_8_L.webm')
  })
  it('should return correct video for attach right 1', () => {
    const mockPipetteWizardStep = {
      mount: RIGHT,
      flowType: FLOWS.ATTACH,
      section: SECTIONS.MOUNT_PIPETTE,
    }
    render(
      getPipetteAnimations({
        pipetteWizardStep: mockPipetteWizardStep,
      })
    )
    screen.getByTestId('Pipette_Attach_1_8_R.webm')
  })
})
