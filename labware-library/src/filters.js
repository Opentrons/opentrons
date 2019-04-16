// @flow
// filter helpers
import queryString from 'query-string'
import pickBy from 'lodash/pickBy'
import uniq from 'lodash/uniq'

import { getAllDefinitions } from './definitions'
import { getPublicPath } from './public-path'

import type { Location } from 'react-router-dom'
import type { FilterParams, LabwareDefinition } from './types'

export const FILTER_OFF = 'all'

export function getAllCategories(): Array<string> {
  const categories = getAllDefinitions().map(d => d.metadata.displayCategory)

  return [FILTER_OFF].concat(uniq(categories))
}

export function getAllManufacturers(): Array<string> {
  const manufacturers = getAllDefinitions().map(d => d.brand.brand)

  return [FILTER_OFF].concat(uniq(manufacturers))
}

export function getFilters(
  location: Location,
  definition: LabwareDefinition | null
): FilterParams {
  if (definition) {
    return {
      category: definition.metadata.displayCategory,
      manufacturer: definition.brand.brand,
    }
  }

  const queryParams = queryString.parse(location.search)
  const category = queryParams.category || FILTER_OFF
  const manufacturer = queryParams.manufacturer || FILTER_OFF

  return { category, manufacturer }
}

export function buildFiltersUrl(filters: FilterParams): string {
  const params = pickBy(filters, v => v !== FILTER_OFF)

  return `${getPublicPath()}?${queryString.stringify(params)}`
}
