import { LEFT, RIGHT, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'

import { FLOWS, SECTIONS } from './constants'

import type { PipetteMount } from '@opentrons/shared-data'
import type {
  PipetteWizardFlow,
  PipetteWizardStep,
  SelectablePipettes,
} from './types'

export function insertSelectSlotAfterAttachProbe(
  steps: PipetteWizardStep[],
  includeSlotSelect: boolean = true
): PipetteWizardStep[] {
  if (!includeSlotSelect) {
    return steps
  }

  return steps.flatMap(step =>
    step.section === SECTIONS.ATTACH_PROBE
      ? [
          step,
          {
            section: SECTIONS.SELECT_SLOT,
            mount: step.mount,
            flowType: step.flowType,
          },
        ]
      : [step]
  )
}

const getPipetteWizardStepsWithoutSlotSelect = (
  flowType: PipetteWizardFlow,
  mount: PipetteMount,
  selectedPipette: SelectablePipettes,
  isGantryEmpty: boolean
): PipetteWizardStep[] | null => {
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      return [
        { section: SECTIONS.BEFORE_BEGINNING, mount, flowType },
        { section: SECTIONS.ATTACH_PROBE, mount, flowType },
        { section: SECTIONS.DETACH_PROBE, mount, flowType },
        { section: SECTIONS.RESULTS, mount, flowType },
      ]
    }

    case FLOWS.ATTACH: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        return [
          {
            section: SECTIONS.BEFORE_BEGINNING,
            mount,
            flowType,
          },
          { section: SECTIONS.MOUNT_PIPETTE, mount, flowType },
          {
            section: SECTIONS.FIRMWARE_UPDATE,
            mount,
            flowType,
          },
          { section: SECTIONS.RESULTS, mount, flowType },
          { section: SECTIONS.ATTACH_PROBE, mount, flowType },
          { section: SECTIONS.DETACH_PROBE, mount, flowType },
          {
            section: SECTIONS.RESULTS,
            mount,
            flowType: FLOWS.CALIBRATE,
          },
        ]
      }
      if (!isGantryEmpty) {
        //  pipette needs to be detached before attached 96 channel
        const detachMount: PipetteMount = mount === LEFT ? RIGHT : LEFT
        return [
          {
            section: SECTIONS.BEFORE_BEGINNING,
            mount: detachMount,
            flowType,
          },
          {
            section: SECTIONS.DETACH_PIPETTE,
            mount: detachMount,
            flowType: FLOWS.DETACH,
          },
          {
            section: SECTIONS.RESULTS,
            mount: detachMount,
            flowType: FLOWS.DETACH,
            nextMount: 'both',
          },
          {
            section: SECTIONS.CARRIAGE,
            mount: LEFT,
            flowType,
          },
          {
            section: SECTIONS.MOUNTING_PLATE,
            mount: LEFT,
            flowType,
          },
          {
            section: SECTIONS.MOUNT_PIPETTE,
            mount: LEFT,
            flowType,
          },
          {
            section: SECTIONS.FIRMWARE_UPDATE,
            mount: LEFT,
            flowType,
          },
          { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
          {
            section: SECTIONS.ATTACH_PROBE,
            mount: LEFT,
            flowType,
          },
          {
            section: SECTIONS.DETACH_PROBE,
            mount: LEFT,
            flowType,
          },
          {
            section: SECTIONS.RESULTS,
            mount: LEFT,
            flowType: FLOWS.CALIBRATE,
          },
        ]
      }
      //  gantry empty to attach 96 channel
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          mount: LEFT,
          flowType,
        },
        {
          section: SECTIONS.CARRIAGE,
          mount: LEFT,
          flowType,
        },
        {
          section: SECTIONS.MOUNTING_PLATE,
          mount: LEFT,
          flowType,
        },
        {
          section: SECTIONS.MOUNT_PIPETTE,
          mount: LEFT,
          flowType,
        },
        {
          section: SECTIONS.FIRMWARE_UPDATE,
          mount: LEFT,
          flowType,
        },
        { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
        {
          section: SECTIONS.ATTACH_PROBE,
          mount: LEFT,
          flowType,
        },
        {
          section: SECTIONS.DETACH_PROBE,
          mount: LEFT,
          flowType,
        },
        {
          section: SECTIONS.RESULTS,
          mount: LEFT,
          flowType: FLOWS.CALIBRATE,
        },
      ]
    }
    case FLOWS.DETACH: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        return [
          {
            section: SECTIONS.BEFORE_BEGINNING,
            mount,
            flowType,
          },
          {
            section: SECTIONS.DETACH_PIPETTE,
            mount,
            flowType,
          },
          { section: SECTIONS.RESULTS, mount, flowType },
        ]
      }
      //  96 channel detach
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          mount,
          flowType,
        },
        {
          section: SECTIONS.DETACH_PIPETTE,
          mount,
          flowType,
        },
        {
          section: SECTIONS.MOUNTING_PLATE,
          mount,
          flowType,
        },
        {
          section: SECTIONS.CARRIAGE,
          mount,
          flowType,
        },
        { section: SECTIONS.RESULTS, mount, flowType },
      ]
    }
  }
}

export const getPipetteWizardSteps = (
  flowType: PipetteWizardFlow,
  mount: PipetteMount,
  selectedPipette: SelectablePipettes,
  isGantryEmpty: boolean,
  includeSlotSelect: boolean = true
): PipetteWizardStep[] | null => {
  const steps = getPipetteWizardStepsWithoutSlotSelect(
    flowType,
    mount,
    selectedPipette,
    isGantryEmpty
  )
  if (steps == null) {
    return null
  }
  return insertSelectSlotAfterAttachProbe(steps, includeSlotSelect)
}
