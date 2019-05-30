// @flow
import uniqBy from 'lodash/uniqBy'

import { WELL_TYPE_BY_CATEGORY } from '../../localization'

import type { LabwareWellGroupProperties, LabwareDefinition } from '../../types'

export function getWellLabel(
  spec: LabwareDefinition | LabwareWellGroupProperties,
  fallback?: LabwareDefinition | LabwareWellGroupProperties
): string {
  let { displayCategory } = spec.metadata

  if (spec.groups && spec.groups.length > 0) {
    const categories = spec.groups.map(g => g.metadata.displayCategory)
    const uniqCats = uniqBy(categories).filter(Boolean)

    if (uniqCats.length === 1) {
      displayCategory = uniqCats[0]
    }
  }

  if (displayCategory && WELL_TYPE_BY_CATEGORY[displayCategory]) {
    return WELL_TYPE_BY_CATEGORY[displayCategory]
  }

  if (fallback) {
    return getWellLabel(fallback)
  }

  return WELL_TYPE_BY_CATEGORY.other
}
