import uniqBy from 'lodash/uniqBy'
import type {
  LabwareWellGroupProperties,
  LabwareDefinition,
} from '../../../pages/Labware/types'
const WELL_TYPE_BY_CATEGORY = {
  tubeRack: 'tube',
  tipRack: 'tip',
  other: 'well',
}

export type LabelSpec = LabwareDefinition | LabwareWellGroupProperties

export const getWellLabel = (spec: LabelSpec, fallback?: LabelSpec): string =>
  getLabel(WELL_TYPE_BY_CATEGORY, spec, fallback)

function getLabel(
  labelMap: Record<string, string>,
  spec: LabelSpec,
  fallback?: LabelSpec
): string {
  let { displayCategory } = spec.metadata

  if ('groups' in spec && spec.groups.length > 0) {
    const categories = spec.groups.map(g => g.metadata.displayCategory)
    // @ts-expect-error(IL, 2021-03-25): `uniqBy` 2nd arg should be optional, but TS wants it explicit
    const uniqCats = uniqBy(categories).filter(Boolean)

    if (uniqCats.length === 1) {
      displayCategory = uniqCats[0]
    }
  }

  if (displayCategory && labelMap[displayCategory]) {
    return labelMap[displayCategory]
  }

  if (fallback) {
    return getLabel(labelMap, fallback)
  }

  return labelMap.other
}
