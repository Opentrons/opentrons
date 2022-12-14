import { FLOWS, SECTIONS } from './constants'
import {
  SINGLE_MOUNT_PIPETTES,
  NINETY_SIX_CHANNEL,
} from '@opentrons/shared-data'
import type {
  PipetteWizardStep,
  PipetteWizardFlow,
  SelectablePipettes,
} from './types'
import type { PipetteMount } from '@opentrons/shared-data'

export const getPipetteWizardSteps = (
  flowType: PipetteWizardFlow,
  mount: PipetteMount,
  selectedPipette: SelectablePipettes
): PipetteWizardStep[] => {
  if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
    switch (flowType) {
      case FLOWS.CALIBRATE: {
        return [
          {
            section: SECTIONS.BEFORE_BEGINNING,
            mount: mount,
            flowType: flowType,
          },
          { section: SECTIONS.ATTACH_PROBE, mount: mount, flowType: flowType },
          { section: SECTIONS.DETACH_PROBE, mount: mount, flowType: flowType },
          { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
        ]
      }
      case FLOWS.ATTACH: {
        return [
          {
            section: SECTIONS.BEFORE_BEGINNING,
            mount: mount,
            flowType: flowType,
          },
          { section: SECTIONS.MOUNT_PIPETTE, mount: mount, flowType: flowType },
          { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
          { section: SECTIONS.ATTACH_PROBE, mount: mount, flowType: flowType },
          { section: SECTIONS.DETACH_PROBE, mount: mount, flowType: flowType },
          { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
        ]
      }
      case FLOWS.DETACH: {
        return [
          {
            section: SECTIONS.BEFORE_BEGINNING,
            mount: mount,
            flowType: flowType,
          },
          {
            section: SECTIONS.DETACH_PIPETTE,
            mount: mount,
            flowType: flowType,
          },
          { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
        ]
      }
    }
  } else if (selectedPipette === NINETY_SIX_CHANNEL) {
    switch (flowType) {
      case FLOWS.CALIBRATE: {
        //  TODO(jr 12/1/22): add the calibrate flow steps
        return []
      }
      case FLOWS.ATTACH: {
        return [
          {
            section: SECTIONS.BEFORE_BEGINNING,
            mount: mount,
            flowType: flowType,
          },
          {
            section: SECTIONS.CARRIAGE,
            mount: mount,
            flowType: flowType,
          },
          {
            section: SECTIONS.MOUNTING_PLATE,
            mount: mount,
            flowType: flowType,
          },
          { section: SECTIONS.MOUNT_PIPETTE, mount: mount, flowType: flowType },
          { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
        ]
      }
      case FLOWS.DETACH: {
        return [
          {
            section: SECTIONS.BEFORE_BEGINNING,
            mount: mount,
            flowType: flowType,
          },
          {
            section: SECTIONS.DETACH_PIPETTE,
            mount: mount,
            flowType: flowType,
          },
          {
            section: SECTIONS.MOUNTING_PLATE,
            mount: mount,
            flowType: flowType,
          },
          {
            section: SECTIONS.CARRIAGE,
            mount: mount,
            flowType: flowType,
          },
          { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
        ]
      }
    }
  } else {
    return []
  }
  return []
}
