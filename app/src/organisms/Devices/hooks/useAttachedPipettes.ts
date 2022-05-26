import { usePipettesQuery } from '@opentrons/react-api-client'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import * as Constants from '../../../redux/pipettes/constants'

import type { PipetteModel } from '@opentrons/shared-data'
import type { AttachedPipettesByMount } from '../../../redux/pipettes/types'

export function useAttachedPipettes(): AttachedPipettesByMount {
  const attachedPipettesResponse = usePipettesQuery().data

  return Constants.PIPETTE_MOUNTS.reduce<AttachedPipettesByMount>(
    (result, mount) => {
      const attached = attachedPipettesResponse?.[mount] || null
      const modelSpecs =
        attached && attached.model
          ? getPipetteModelSpecs(attached.model as PipetteModel)
          : null

      if (attached && attached.model && modelSpecs) {
        result[mount] = { ...attached, modelSpecs }
      }

      return result
    },
    { left: null, right: null }
  )
}
