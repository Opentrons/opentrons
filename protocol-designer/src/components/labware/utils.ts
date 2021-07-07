import reduce from 'lodash/reduce'
import { AIR } from '@opentrons/step-generation'
import { swatchColors, MIXED_WELL_COLOR } from '../swatchColors'
import { WellFill } from '@opentrons/components'
import { ContentsByWell, WellContents } from '../../labware-ingred/types'

const ingredIdsToColor = (groupIds: string[]): string | null | undefined => {
  const filteredIngredIds = groupIds.filter(id => id !== AIR)
  if (filteredIngredIds.length === 0) return null

  if (filteredIngredIds.length === 1) {
    return swatchColors(filteredIngredIds[0])
  }

  return MIXED_WELL_COLOR
}

export const wellFillFromWellContents = (
  wellContents: ContentsByWell
): WellFill =>
  reduce(
    wellContents,
    (acc: WellFill, wellContents: WellContents, wellName: string) => {
      const wellFill = ingredIdsToColor(wellContents.groupIds)
      return wellFill ? { ...acc, [wellName]: wellFill } : acc
    },
    {}
  )
