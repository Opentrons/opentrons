import round from 'lodash/round'
import {
  createRegularLoadName,
  createDefaultDisplayName,
} from '@opentrons/shared-data'
import {
  aluminumBlockAutofills,
  DISPLAY_VOLUME_UNITS,
  tubeRackAutofills,
  labwareTypeAutofills,
  DEFAULT_RACK_BRAND,
} from './fields'
import type { LabwareFields } from './fields'
import { getIsOpentronsTubeRack } from './utils/getIsOpentronsTubeRack'
import { getIsCustomTubeRack } from './utils/getIsCustomTubeRack'
// TODO(Ian, 2019-07-24): consolidate `tubeRackAutofills/aluminumBlockAutofills`-getting logic btw here and makeAutofillOnChange
export const _getIsAutofilled = (
  name: keyof LabwareFields,
  values: Partial<LabwareFields>
): boolean => {
  const { labwareType, aluminumBlockType, tubeRackInsertLoadName } = values

  if (
    labwareType != null &&
    Object.keys(labwareTypeAutofills[labwareType]).includes(name)
  ) {
    // labwareTypeAutofills isn't populated for all labware types, but when it is
    // populated it has precedent over all the cases below.
    return true
  }

  if (labwareType === 'aluminumBlock' && aluminumBlockType != null) {
    return (
      // @ts-expect-error(IL, 2021-03-18): aluminumBlockType not strictly typed enough
      Object.keys(aluminumBlockAutofills[aluminumBlockType] || {}).includes(
        name
      )
    )
  } else if (labwareType === 'tubeRack' && tubeRackInsertLoadName != null) {
    return Object.keys(
      tubeRackAutofills[tubeRackInsertLoadName] || {}
    ).includes(name)
  }
  return false
}

// any fields that are conditionally defaulted by the Yup schema and do not need to be displayed.
export const _getIsDefaulted = (
  name: keyof LabwareFields,
  values: LabwareFields
): boolean => {
  if (
    ['gridSpacingX', 'regularColumnSpacing'].includes(name) &&
    Number(values.gridColumns) === 1
  ) {
    return true
  }
  if (
    ['gridSpacingY', 'regularRowSpacing'].includes(name) &&
    Number(values.gridRows) === 1
  ) {
    return true
  }
  return false
}

// a field should be hidden when it is autofilled or is defaulted
export const getIsHidden = (
  name: keyof LabwareFields,
  values: LabwareFields
): boolean =>
  (values.labwareType != null && _getIsAutofilled(name, values)) ||
  _getIsDefaulted(name, values)

// TODO(IL, 2021-03-18): _valuesToCreateNameArgs should return RegularNameProps from shared-data/js/labwareTools/index.js
const _valuesToCreateNameArgs = (values: LabwareFields): any => {
  const gridRows = Number(values.gridRows) || 1
  const gridColumns = Number(values.gridColumns) || 1
  const brand = (values.brand || '').trim()

  let brandDefault: string | undefined

  return {
    gridColumns,
    gridRows,
    displayCategory: values.labwareType || '',
    displayVolumeUnits: DISPLAY_VOLUME_UNITS,
    brandName: brand === '' ? brandDefault : brand,
    totalLiquidVolume: Number(values.wellVolume) || 0,
  }
}
const _getTubeRackDisplayName = (values: LabwareFields): string => {
  const rows = Number(values.gridRows) || 1
  const columns = Number(values.gridColumns) || 1
  const volume = Number(values.wellVolume) || 0
  const wellCount = rows * columns

  return `${values.brand || 'Generic'} ${wellCount} Tube Rack with ${
    values.groupBrand || 'Generic'
  } ${round(volume / 1000, 2)} mL`
}
export const getDefaultLoadName = (values: LabwareFields): string => {
  let args
  if (getIsOpentronsTubeRack(values)) {
    args = _valuesToCreateNameArgs({ ...values, brand: DEFAULT_RACK_BRAND })
  } else {
    args = _valuesToCreateNameArgs(values)
  }
  return createRegularLoadName(args)
}

export const getDefaultDisplayName = (values: LabwareFields): string => {
  if (getIsOpentronsTubeRack(values)) {
    return _getTubeRackDisplayName({ ...values, brand: DEFAULT_RACK_BRAND })
  } else if (getIsCustomTubeRack(values)) {
    return _getTubeRackDisplayName(values)
  }

  return createDefaultDisplayName(_valuesToCreateNameArgs(values))
}
