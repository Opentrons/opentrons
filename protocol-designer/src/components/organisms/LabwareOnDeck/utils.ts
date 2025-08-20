import reduce from 'lodash/reduce'

import { AIR } from '@opentrons/step-generation'

import {
  MIXED_WELL_COLOR,
  swatchColors,
} from '../DefineLiquidsModal/swatchColors'

import type { WellFill } from '@opentrons/components'
import type {
  ContentsByWell,
  WellContents,
} from '../../../labware-ingred/types'

const ingredIdsToColor = (
  groupIds: string[],
  displayColors: Record<string, string> // liquidGroupId -> color
): string | null | undefined => {
  const filteredIngredIds = groupIds.filter(id => id !== AIR)
  if (filteredIngredIds.length === 0) return null

  if (filteredIngredIds.length === 1) {
    return (
      displayColors[filteredIngredIds[0]] ?? swatchColors(filteredIngredIds[0])
    )
  }

  return MIXED_WELL_COLOR
}

export const wellFillFromWellContents = (
  wellContents: ContentsByWell,
  displayColors: Record<string, string> // liquidGroupId -> color
): WellFill =>
  reduce(
    wellContents,
    (acc: WellFill, wellContents: WellContents, wellName: string) => {
      const wellFill = ingredIdsToColor(wellContents.groupIds, displayColors)
      return wellFill ? { ...acc, [wellName]: wellFill } : acc
    },
    {}
  )
