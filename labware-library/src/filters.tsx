// filter helpers
import { useState, useLayoutEffect } from 'react'
import queryString from 'query-string'
import flatMap from 'lodash/flatMap'
import pickBy from 'lodash/pickBy'
import uniq from 'lodash/uniq'

import { getAllDefinitions } from '@opentrons/shared-data'
import { getPublicPath } from './public-path'

import type { Location } from 'history'
import type { FilterParams, LabwareDefinition, LabwareList } from './types'

export const FILTER_OFF = 'all'

export function getAllCategories(): string[] {
  const categories = getAllDefinitions().map(d => d.metadata.displayCategory)

  return [FILTER_OFF].concat(uniq(categories))
}

export function getAllManufacturers(): string[] {
  const definitions = getAllDefinitions()
  const brands = definitions.map(d => d.brand.brand)
  const wellGroupBrands = flatMap<LabwareDefinition, string>(
    definitions,
    d => d.groups.map(g => g.brand?.brand).filter(Boolean) as string[]
  )

  return uniq([FILTER_OFF, ...brands, ...wellGroupBrands])
}

export function useFilters(location: Location): FilterParams {
  const [params, setParams] = useState({
    category: FILTER_OFF,
    manufacturer: FILTER_OFF,
  })

  // layout effect (rather than regular effect) to trigger a state change
  // before paint if needed
  useLayoutEffect(() => {
    const queryParams = queryString.parse(location.search)
    // TODO(IL, 2021-03-31): handle possible string[] (instead of string) in query param
    // (eg category=tipRack&category=wellPlate will return ["tipRack", "wellPlate"])
    const category = (queryParams.category as string) || FILTER_OFF
    const manufacturer = (queryParams.manufacturer as string) || FILTER_OFF

    setParams({ category, manufacturer })
  }, [location.search])

  return params
}

export function buildFiltersUrl(filters: FilterParams): string {
  const params = pickBy(filters, v => v !== FILTER_OFF)

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return `${getPublicPath()}?${queryString.stringify(params)}`
}

export function getFilteredDefinitions(filters: FilterParams): LabwareList {
  return getAllDefinitions().filter(
    def =>
      testCategory(filters.category, def) &&
      testManufacturer(filters.manufacturer, def)
  )
}

export function testManufacturer(
  manufacturer: string | null | undefined,
  definition: LabwareDefinition
): boolean {
  return (
    !manufacturer ||
    manufacturer === FILTER_OFF ||
    manufacturer === definition.brand.brand ||
    definition.groups.some(g => g.brand?.brand === manufacturer)
  )
}

export function testCategory(
  category: string | null | undefined,
  definition: LabwareDefinition
): boolean {
  return (
    !category ||
    category === FILTER_OFF ||
    category === definition.metadata.displayCategory
  )
}
