import { useDispatch, useSelector } from 'react-redux'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { HydratedFlexStackerFormData } from '/protocol-designer/form-types'
import { createLabwareAndQueueForHopper } from '/protocol-designer/step-forms/actions/thunks'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import type { FormData } from '/protocol-designer/form-types'
import type { ThunkDispatch } from '/protocol-designer/types'

export function useFillStackerLabware(formData: FormData): (() => void) | null {
  const { modules } = useSelector(getRobotStateAtActiveItem) ?? {}
  const dispatch = useDispatch<ThunkDispatch<any>>()
  if (
    !(
      formData.stepType === 'flexStacker' &&
      formData.flexStackerFormType === 'fill'
    )
  ) {
    return null
  }
  const hydratedFormData = formData as HydratedFlexStackerFormData
  const { moduleId, fillQuantity } = hydratedFormData
  if (fillQuantity == null) {
    return null
  }
  const moduleState = modules?.[moduleId]?.moduleState
  if (moduleState == null || moduleState.type !== FLEX_STACKER_MODULE_TYPE) {
    return null
  }
  const { storedLabwareDetails } = moduleState
  if (storedLabwareDetails == null) {
    return null
  }
  return () => {
    dispatch(
      createLabwareAndQueueForHopper({
        storedLabwareGroup: storedLabwareDetails,
        amount: fillQuantity,
        moduleId,
      })
    )
  }
}
