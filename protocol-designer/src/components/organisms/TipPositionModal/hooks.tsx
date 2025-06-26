import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { round } from 'lodash'

import { DropdownMenu } from '@opentrons/components'
import {
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_CENTER,
  POSITION_REFERENCE_TOP,
} from '@opentrons/shared-data'

import { getRobotType } from '../../../file-data/selectors'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getPipetteEntities,
} from '../../../step-forms/selectors'
import { getLiquidClassesValues } from '../../../steplist/formLevel/handleFormChange/utils'

import type { Dispatch, SetStateAction } from 'react'
import type { DropdownOption } from '@opentrons/components'
import type { PositionReference, WellLocation } from '@opentrons/shared-data'
import type { FormData } from '../../../form-types'
import type { MoveLiquidPrefixType } from '../../../resources/types'

interface UsePositionReferenceResult {
  positionReferenceDropdown: JSX.Element
  reference: PositionReference
  setReference: Dispatch<SetStateAction<PositionReference>>
}

export function usePositionReference(args: {
  zValue: number
  updateZValue: Dispatch<SetStateAction<string | null>>
  wellDepth: number
  initialReference?: unknown
}): UsePositionReferenceResult {
  const { initialReference, zValue, updateZValue, wellDepth } = args
  const { t } = useTranslation('modal')
  const [reference, setReference] = useState<PositionReference>(
    initialReference != null
      ? (initialReference as PositionReference)
      : POSITION_REFERENCE_BOTTOM
  )

  const handleUpdateReference = (
    oldReference: PositionReference,
    newReference: PositionReference,
    zValue: number
  ): void => {
    let newZValue = zValue
    if (oldReference === POSITION_REFERENCE_BOTTOM) {
      switch (newReference) {
        case POSITION_REFERENCE_CENTER:
          newZValue = zValue - wellDepth / 2
          break
        case POSITION_REFERENCE_TOP:
          newZValue = zValue - wellDepth
          break
        default:
          break
      }
    } else if (oldReference === POSITION_REFERENCE_CENTER) {
      switch (newReference) {
        case POSITION_REFERENCE_BOTTOM:
          newZValue = zValue + wellDepth / 2
          break
        case POSITION_REFERENCE_TOP:
          newZValue = zValue - wellDepth / 2
          break
        default:
          break
      }
    } else if (oldReference === POSITION_REFERENCE_TOP) {
      switch (newReference) {
        case POSITION_REFERENCE_BOTTOM:
          newZValue = zValue + wellDepth
          break
        case POSITION_REFERENCE_CENTER:
          newZValue = zValue + wellDepth / 2
          break
        default:
          break
      }
    }
    updateZValue(String(round(newZValue, 1)))
  }

  const referenceOptions: DropdownOption[] = [
    {
      name: t(`tip_position.position_references.${POSITION_REFERENCE_TOP}`),
      value: POSITION_REFERENCE_TOP,
    },
    {
      name: t(`tip_position.position_references.${POSITION_REFERENCE_CENTER}`),
      value: POSITION_REFERENCE_CENTER,
    },
    {
      name: t(`tip_position.position_references.${POSITION_REFERENCE_BOTTOM}`),
      value: POSITION_REFERENCE_BOTTOM,
    },
  ]
  return {
    positionReferenceDropdown: (
      <DropdownMenu
        title={t('tip_position.field_titles.reference_position')}
        dropdownType="neutral"
        width="100%"
        currentOption={
          referenceOptions.find(({ value }) => value === reference) ??
          referenceOptions[0]
        }
        filterOptions={referenceOptions}
        onClick={e => {
          const newReference = e as PositionReference
          handleUpdateReference(reference, newReference, zValue)
          setReference(e as PositionReference)
        }}
      />
    ),
    reference,
    setReference,
  }
}

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
