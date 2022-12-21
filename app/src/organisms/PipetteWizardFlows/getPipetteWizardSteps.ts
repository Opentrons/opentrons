import { FLOWS, SECTIONS } from './constants'
import {
  SINGLE_MOUNT_PIPETTES,
  NINETY_SIX_CHANNEL,
  LEFT,
  RIGHT,
} from '@opentrons/shared-data'
import type {
  PipetteWizardStep,
  PipetteWizardFlow,
  SelectablePipettes,
} from './types'
import type { PipetteMount } from '@opentrons/shared-data'
import { AttachedPipettesByMount } from '@opentrons/api-client'

export const getPipetteWizardSteps = (
  flowType: PipetteWizardFlow,
  mount: PipetteMount,
  selectedPipette: SelectablePipettes,
  isGantryEmpty: boolean,
  attachedPipettes: AttachedPipettesByMount
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
        let detachMount = mount
        if (attachedPipettes[LEFT] == null) {
          detachMount = RIGHT
        } else if (attachedPipettes[RIGHT] == null) {
          detachMount = LEFT
        }

        //  for attaching 96 channel but a pipette is attached
        if (!isGantryEmpty) {
          return [
            {
              section: SECTIONS.BEFORE_BEGINNING,
              mount: detachMount,
              flowType: flowType,
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
            },
            {
              section: SECTIONS.CARRIAGE,
              mount: LEFT,
              flowType: flowType,
            },
            {
              section: SECTIONS.MOUNTING_PLATE,
              mount: LEFT,
              flowType: flowType,
            },
            {
              section: SECTIONS.MOUNT_PIPETTE,
              mount: LEFT,
              flowType: flowType,
            },
            { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
          ]
        } else {
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
            {
              section: SECTIONS.MOUNT_PIPETTE,
              mount: mount,
              flowType: flowType,
            },
            { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
          ]
        }
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
