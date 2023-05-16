import { LEFT, LoadedPipette, RIGHT } from '@opentrons/shared-data'
import { FLOWS, SECTIONS } from './constants'
import type { Mount } from '../../redux/pipettes/types'
import type { AttachedPipettesFromInstrumentsQuery } from '../Devices/hooks'
import type { PipetteWizardStep } from './types'

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
          section: SECTIONS.BEFORE_BEGINNING,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.MOUNT_PIPETTE,
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
          section: SECTIONS.BEFORE_BEGINNING,
          mount: mount,
          flowType: FLOWS.ATTACH,
        },
        {
          section: SECTIONS.MOUNT_PIPETTE,
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
