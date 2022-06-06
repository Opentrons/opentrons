import { format } from 'date-fns'

import * as Pipettes from '../../../../redux/pipettes'

import type {
  AttachedPipettesByMount,
  PipetteCalibrationsByMount,
} from '../../../../redux/pipettes/types'

export const formatLastCalibrated = (lastModified: string): string => {
  return typeof lastModified === 'string'
    ? format(new Date(lastModified), 'M/d/yyyy HH:mm:ss')
    : 'Unknown'
}

export const attachedPipetteCalPresent: (
  pipettes: AttachedPipettesByMount,
  pipetteCalibrations: PipetteCalibrationsByMount
) => boolean = (pipettes, pipetteCalibrations) =>
  !Pipettes.PIPETTE_MOUNTS.some(
    mount =>
      pipettes?.[mount] != null &&
      (pipetteCalibrations[mount]?.offset == null ||
        pipetteCalibrations[mount]?.tipLength == null)
  )
