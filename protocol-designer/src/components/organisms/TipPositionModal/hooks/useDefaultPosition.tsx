import { useSelector } from 'react-redux'

import { getRobotType } from '../../../../file-data/selectors'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../step-forms/selectors'
import { getLiquidClassesValues } from '../../../../steplist/formLevel/handleFormChange/utils'

import type { WellLocation } from '@opentrons/shared-data'
import type { FormData } from '../../../../form-types'
import type { MoveLiquidPrefixType } from '../../../../resources/types'

export function useDefaultPosition(
  formData: FormData | null,
  prefix: MoveLiquidPrefixType
): WellLocation {
  const pipetteEntities = useSelector(getPipetteEntities)
  const labwareEntities = useSelector(getLabwareEntities)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const robotType = useSelector(getRobotType)
  if (formData == null) {
    return {}
  }
  const liquidClassDefaultValues = getLiquidClassesValues({
    rawForm: formData,
    pipetteEntities,
    labwareEntities,
    additionalEquipmentEntities,
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
