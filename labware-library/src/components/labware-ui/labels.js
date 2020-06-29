// @flow
import uniqBy from 'lodash/uniqBy'

import { WELL_TYPE_BY_CATEGORY } from '../../localization'
import type { LabwareDefinition, LabwareWellGroupProperties } from '../../types'

export type LabelSpec = LabwareDefinition | LabwareWellGroupProperties

export const getWellLabel = (spec: LabelSpec, fallback?: LabelSpec): string =>
  getLabel(WELL_TYPE_BY_CATEGORY, spec, fallback)

function getLabel(
  labelMap: { [string]: string },
  spec: LabelSpec,
  fallback?: LabelSpec
): string {
  let { displayCategory } = spec.metadata

  if (spec.groups && spec.groups.length > 0) {
    const categories = spec.groups.map(g => g.metadata.displayCategory)
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
