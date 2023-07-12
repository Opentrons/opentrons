import { render, screen } from '@testing-library/react'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import { mockAttachedPipetteInformation } from '../../../redux/pipettes/__fixtures__'
import {
  getIsGantryEmpty,
  getPipetteAnimations,
  getPipetteAnimations96,
} from '../utils'
import { FLOWS, SECTIONS } from '../constants'

describe('getIsGantryEmpty', () => {
  it('should return true when no pipettes attached', () => {
    expect(getIsGantryEmpty({ left: null, right: null })).toEqual(true)
  })
  it('should return false when 1 pipette is attached', () => {
    expect(
      getIsGantryEmpty({ left: mockAttachedPipetteInformation, right: null })
    ).toEqual(false)
  })
  it('should return false when 2 pipettes are attached', () => {
    expect(
      getIsGantryEmpty({
        left: mockAttachedPipetteInformation,
        right: mockAttachedPipetteInformation,
      })
    ).toEqual(false)
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

describe('getPipetteAnimations96', () => {
  it('should return correct video for mount pipette', () => {
    render(
      getPipetteAnimations96({
        section: SECTIONS.MOUNT_PIPETTE,
        flowType: FLOWS.ATTACH,
      })
    )
    screen.getByTestId('Pipette_Attach_96.webm')
  })
  it('should return correct video for attaching plate attach', () => {
    render(
      getPipetteAnimations96({
        section: SECTIONS.MOUNTING_PLATE,
        flowType: FLOWS.ATTACH,
      })
    )
    screen.getByTestId('Pipette_Attach_Plate_96.webm')
  })
  it('should return correct video for attaching plate detach', () => {
    render(
      getPipetteAnimations96({
        section: SECTIONS.MOUNTING_PLATE,
        flowType: FLOWS.DETACH,
      })
    )
    screen.getByTestId('Pipette_Detach_Plate_96.webm')
  })
  it('should return correct video for detach pipette', () => {
    render(
      getPipetteAnimations96({
        section: SECTIONS.DETACH_PIPETTE,
        flowType: FLOWS.DETACH,
      })
    )
    screen.getByTestId('Pipette_Detach_96.webm')
  })
  it('should return correct video for z axis attach', () => {
    render(
      getPipetteAnimations96({
        section: SECTIONS.CARRIAGE,
        flowType: FLOWS.ATTACH,
      })
    )
    screen.getByTestId('Pipette_Zaxis_Attach_96.webm')
  })
  it('should return correct video for z axis detach', () => {
    render(
      getPipetteAnimations96({
        section: SECTIONS.CARRIAGE,
        flowType: FLOWS.DETACH,
      })
    )
    screen.getByTestId('Pipette_Zaxis_Detach_96.webm')
  })
})
