import { useSelector } from 'react-redux'

import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import {
  getAdditionalEquipmentEntities,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'
import { getLiquidClassesValues } from '/protocol-designer/steplist/formLevel/handleFormChange/utils'

import type { WellLocation } from '@opentrons/shared-data'
import type { FormData } from '/protocol-designer/form-types'
import type { MoveLiquidPrefixType } from '/protocol-designer/resources/types'

export function useDefaultPosition(
  formData: FormData | null,
  prefix: MoveLiquidPrefixType
): WellLocation {
  const pipetteEntities = useSelector(getPipetteEntities)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const allLabwareDefs = useSelector(getLabwareDefsByURI)
  const robotType = useSelector(getRobotType)
  if (formData == null) {
    return {}
  }
  const liquidClassDefaultValues = getLiquidClassesValues({
    rawForm: formData,
    pipetteEntities,
    additionalEquipmentEntities,
    allLabwareDefs,
    robotType,
  })
  return {
    origin: liquidClassDefaultValues[`${prefix}_position_reference`],
    offset: {
      x: liquidClassDefaultValues[`${prefix}_x_position`],
      y: liquidClassDefaultValues[`${prefix}_y_position`],
      z: liquidClassDefaultValues[`${prefix}_mmFromBottom`],
    },
  }
}
