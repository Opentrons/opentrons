import * as React from 'react'

import {
  SINGLE_MOUNT_PIPETTES,
  LEFT,
  RIGHT,
  PipetteMount,
  LoadedPipette,
} from '@opentrons/shared-data'

import { FLOWS, SECTIONS } from './constants'
import { useFilterWizardStepsFrom } from '../../resources/wizards/hooks'

import type { Subsystem } from '@opentrons/api-client'
import type {
  PipetteWizardFlow,
  PipetteWizardStep,
  SelectablePipettes,
} from './types'
import type { AttachedPipettesFromInstrumentsQuery } from '../Devices/hooks'
import type { Mount } from '../../redux/pipettes/types'

interface UseFilteredPipetteWizardStepsProps {
  memoizedPipetteInfo: LoadedPipette[] | null
  flowType: PipetteWizardFlow
  mount: PipetteMount
  selectedPipette: SelectablePipettes
  isGantryEmpty: boolean
  attachedPipettes: AttachedPipettesFromInstrumentsQuery
  subsystem: Subsystem
}

export const useFilteredPipetteWizardSteps = ({
  memoizedPipetteInfo,
  flowType,
  mount,
  selectedPipette,
  isGantryEmpty,
  attachedPipettes,
  subsystem,
}: UseFilteredPipetteWizardStepsProps): PipetteWizardStep[] => {
  const determinedPipetteWizardSteps = React.useMemo(
    () =>
      memoizedPipetteInfo == null
        ? getPipetteWizardSteps(flowType, mount, selectedPipette, isGantryEmpty)
        : getPipetteWizardStepsForProtocol(
            attachedPipettes,
            memoizedPipetteInfo,
            mount
          ),
    []
  )
  return useFilterWizardStepsFrom(determinedPipetteWizardSteps, subsystem)
}

export const getPipetteWizardSteps = (
  flowType: PipetteWizardFlow,
  mount: PipetteMount,
  selectedPipette: SelectablePipettes,
  isGantryEmpty: boolean
): PipetteWizardStep[] => {
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
        {
          section: SECTIONS.RESULTS,
          mount: mount,
          flowType: flowType,
        },
      ]
    }
    case FLOWS.ATTACH: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        return [
          {
            section: SECTIONS.BEFORE_BEGINNING,
            mount: mount,
            flowType: flowType,
          },
          { section: SECTIONS.MOUNT_PIPETTE, mount: mount, flowType: flowType },
          {
            section: SECTIONS.FIRMWARE_UPDATE,
            mount: mount,
            flowType: flowType,
          },
          { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
          { section: SECTIONS.ATTACH_PROBE, mount: mount, flowType: flowType },
          { section: SECTIONS.DETACH_PROBE, mount: mount, flowType: flowType },
          {
            section: SECTIONS.RESULTS,
            mount: mount,
            flowType: FLOWS.CALIBRATE,
          },
        ]
      } else {
        //  pipette needs to be detached before attached 96 channel
        if (!isGantryEmpty) {
          let detachMount: PipetteMount = LEFT
          if (mount === LEFT) {
            detachMount = RIGHT
          }
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
            {
              section: SECTIONS.FIRMWARE_UPDATE,
              mount: mount,
              flowType: flowType,
            },
            { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
            {
              section: SECTIONS.ATTACH_PROBE,
              mount: mount,
              flowType: flowType,
            },
            {
              section: SECTIONS.DETACH_PROBE,
              mount: mount,
              flowType: flowType,
            },
            {
              section: SECTIONS.RESULTS,
              mount: mount,
              flowType: FLOWS.CALIBRATE,
            },
          ]
          //  gantry empty to attach 96 channel
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
            {
              section: SECTIONS.FIRMWARE_UPDATE,
              mount: mount,
              flowType: flowType,
            },
            { section: SECTIONS.RESULTS, mount: mount, flowType: FLOWS.ATTACH },
            {
              section: SECTIONS.ATTACH_PROBE,
              mount: mount,
              flowType: flowType,
            },
            {
              section: SECTIONS.DETACH_PROBE,
              mount: mount,
              flowType: flowType,
            },
            {
              section: SECTIONS.RESULTS,
              mount: mount,
              flowType: FLOWS.CALIBRATE,
            },
          ]
        }
      }
    }
    case FLOWS.DETACH: {
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
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
        //  96 channel detach
      } else {
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
  }
  return []
}

export const getPipetteWizardStepsForProtocol = (
  attachedPipettes: AttachedPipettesFromInstrumentsQuery,
  pipetteInfo: LoadedPipette[],
  mount: Mount
): PipetteWizardStep[] => {
  const requiredPipette = pipetteInfo.find(pipette => pipette.mount === mount)
  const nintySixChannelAttached =
    attachedPipettes[LEFT]?.instrumentName === 'p1000_96'

  //  return empty array when correct pipette is attached && pipette cal not needed or
  //  no pipette is required in the protocol
  if (
    (requiredPipette?.pipetteName === attachedPipettes[mount]?.instrumentName &&
      attachedPipettes[mount]?.data?.calibratedOffset?.last_modified != null) ||
    requiredPipette == null
  ) {
    return []
    //    return calibration flow only if correct pipette is attached and pipette cal null
  } else if (
    requiredPipette?.pipetteName === attachedPipettes[mount]?.instrumentName &&
    attachedPipettes[mount]?.data?.calibratedOffset?.last_modified == null
  ) {
    return [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: mount,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: mount,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: mount,
        flowType: FLOWS.CALIBRATE,
      },
      { section: SECTIONS.RESULTS, mount: mount, flowType: FLOWS.CALIBRATE },
    ]
  } else if (
    requiredPipette.pipetteName !== 'p1000_96' &&
    attachedPipettes[mount] != null
  ) {
    //    96-channel pipette attached and need to attach single mount pipette
    if (nintySixChannelAttached) {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          mount: LEFT,
          flowType: FLOWS.DETACH,
        },
        {
          section: SECTIONS.DETACH_PIPETTE,
          mount: LEFT,
          flowType: FLOWS.DETACH,
        },
        {
          section: SECTIONS.MOUNTING_PLATE,
          mount: LEFT,
          flowType: FLOWS.DETACH,
        },
        {
          section: SECTIONS.CARRIAGE,
          mount: LEFT,
          flowType: FLOWS.DETACH,
        },
        { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.DETACH },
        {
          section: SECTIONS.MOUNT_PIPETTE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.FIRMWARE_UPDATE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        { section: SECTIONS.RESULTS, mount: mount, flowType: FLOWS.ATTACH },
        {
          section: SECTIONS.ATTACH_PROBE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.DETACH_PROBE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.RESULTS,
          mount: mount,
          flowType: FLOWS.CALIBRATE,
        },
      ]
      //    Single mount pipette attached and need to attach new single mount pipette
    } else {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          mount: mount,
          flowType: FLOWS.DETACH,
        },
        {
          section: SECTIONS.DETACH_PIPETTE,
          mount: mount,
          flowType: FLOWS.DETACH,
        },
        { section: SECTIONS.RESULTS, mount: mount, flowType: FLOWS.DETACH },
        {
          section: SECTIONS.MOUNT_PIPETTE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.FIRMWARE_UPDATE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        { section: SECTIONS.RESULTS, mount: mount, flowType: FLOWS.ATTACH },
        {
          section: SECTIONS.ATTACH_PROBE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.DETACH_PROBE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.RESULTS,
          mount: mount,
          flowType: FLOWS.CALIBRATE,
        },
      ]
    }
    //  Single mount pipette attached to both mounts and need to attach 96-channel pipette
  } else if (
    requiredPipette.pipetteName === 'p1000_96' &&
    attachedPipettes[LEFT] != null &&
    attachedPipettes[RIGHT] != null
  ) {
    return [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.DETACH },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: RIGHT,
        flowType: FLOWS.DETACH,
      },
      { section: SECTIONS.RESULTS, mount: RIGHT, flowType: FLOWS.DETACH },
      {
        section: SECTIONS.CARRIAGE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNTING_PLATE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNT_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.FIRMWARE_UPDATE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
    ]
    //  Single mount pipette attached to left mount and need to attach 96-channel pipette
  } else if (
    requiredPipette.pipetteName === 'p1000_96' &&
    attachedPipettes[LEFT] != null &&
    attachedPipettes[RIGHT] == null
  ) {
    return [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.DETACH },
      {
        section: SECTIONS.CARRIAGE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNTING_PLATE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNT_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.FIRMWARE_UPDATE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
    ]
    //  Single mount pipette attached to right mount and need to attach 96-channel pipette
  } else if (
    requiredPipette.pipetteName === 'p1000_96' &&
    attachedPipettes[LEFT] == null &&
    attachedPipettes[RIGHT] != null
  ) {
    return [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: RIGHT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: RIGHT,
        flowType: FLOWS.DETACH,
      },
      { section: SECTIONS.RESULTS, mount: RIGHT, flowType: FLOWS.DETACH },
      {
        section: SECTIONS.CARRIAGE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNTING_PLATE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNT_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.FIRMWARE_UPDATE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
    ]
    //  if no pipette is attached to gantry
  } else {
    //  Gantry empty and need to attach 96-channel pipette
    if (requiredPipette.pipetteName === 'p1000_96') {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          mount: LEFT,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.CARRIAGE,
          mount: LEFT,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.MOUNTING_PLATE,
          mount: LEFT,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.MOUNT_PIPETTE,
          mount: LEFT,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.FIRMWARE_UPDATE,
          mount: LEFT,
          flowType: FLOWS.ATTACH,
        },
        { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
        {
          section: SECTIONS.ATTACH_PROBE,
          mount: LEFT,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.DETACH_PROBE,
          mount: LEFT,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.RESULTS,
          mount: LEFT,
          flowType: FLOWS.CALIBRATE,
        },
      ]
      //    Gantry empty and need to attach single mount pipette
    } else {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.MOUNT_PIPETTE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.FIRMWARE_UPDATE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        { section: SECTIONS.RESULTS, mount: mount, flowType: FLOWS.ATTACH },
        {
          section: SECTIONS.ATTACH_PROBE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.DETACH_PROBE,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.RESULTS,
          mount: mount,
          flowType: FLOWS.CALIBRATE,
        },
      ]
    }
  }
}
