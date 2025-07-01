import omitBy from 'lodash/omitBy'
import reduce from 'lodash/reduce'

import { DEFAULT_LIQUID_COLORS } from '@opentrons/shared-data'

import { AIR } from './misc'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  LocationLiquidState,
  SingleLabwareLiquidState,
  WellContents,
  WellContentsByNumber,
} from '../types'

/** All wells for labware, in arbitrary order. */
export function getAllWellsForLabware(def: LabwareDefinition2): string[] {
  return Object.keys(def.wells)
}

export type ContentsByWell = Record<string, WellContents> | null

function _wellContentsForWell(
  liquidVolState: LocationLiquidState,
  well: string
): WellContents {
  const ingredGroupIdsWithContent = Object.keys(liquidVolState || {}).filter(
    groupId => liquidVolState[groupId] && liquidVolState[groupId].volume > 0
  )
  return {
    wellName: well,
    groupIds: ingredGroupIdsWithContent,
    ingreds: omitBy(
      liquidVolState,
      ingredData => !ingredData || ingredData.volume <= 0
    ),
  }
}

export function _wellContentsForLabware(
  labwareLiquids: SingleLabwareLiquidState,
  labwareDef: LabwareDefinition2
): ContentsByWell {
  const allWellsForContainer = getAllWellsForLabware(labwareDef)
  return reduce(
    allWellsForContainer,
    (wellAcc, well: string): Record<string, WellContents> => {
      const wellHasContents = labwareLiquids && labwareLiquids[well]
      return {
        ...wellAcc,
        [well]: wellHasContents
          ? _wellContentsForWell(labwareLiquids[well], well)
          : {},
      }
    },
    {}
  )
}

export const getVolumesPerLiquid = (
  wellContents: ContentsByWell,
  individualIds: string[]
): Record<string, WellContentsByNumber> => {
  const volumesPerLiquid: Record<string, WellContentsByNumber> = {}
  individualIds.forEach(id => {
    const volumeByWell: WellContentsByNumber =
      wellContents != null
        ? Object.values(wellContents).reduce(
            (acc: WellContentsByNumber, contents) => {
              const groupIndex = contents.groupIds.indexOf(id)
              if (groupIndex !== -1) {
                const ingred = contents.ingreds[id]
                if (ingred?.volume != null) {
                  acc[contents.wellName ?? 'A1'] = ingred.volume
                }
              }
              return acc
            },
            {}
          )
        : {}

    volumesPerLiquid[id] = volumeByWell
  })
  return volumesPerLiquid
}

export const getLiquidIdsOnLabware = (
  wellContents: ContentsByWell
): string[] => {
  const allLiquidIdsOnLabware =
    wellContents != null
      ? Object.values(wellContents)
          .flatMap(contents => contents.groupIds)
          ?.filter(group => group !== AIR)
      : []
  return Array.from(new Set(allLiquidIdsOnLabware))
}

export const MIXED_WELL_COLOR = '#737578'

export const swatchColors = (ingredGroupId: string): string => {
  const num = Number(ingredGroupId)

  if (!Number.isInteger(num)) {
    if (ingredGroupId !== AIR) {
      console.warn(
        `swatchColors expected an integer or ${AIR}, got ${ingredGroupId}`
      )
    }

    return 'transparent'
  }

  return DEFAULT_LIQUID_COLORS[num % DEFAULT_LIQUID_COLORS.length]
}

const ingredIdsToColor = (
  groupIds: string[],
  displayColors: string[]
): string | null | undefined => {
  const filteredIngredIds = groupIds.filter(id => id !== AIR)
  if (filteredIngredIds.length === 0) return null

  if (filteredIngredIds.length === 1) {
    return (
      displayColors[Number(filteredIngredIds[0])] ??
      swatchColors(filteredIngredIds[0])
    )
  }

  return MIXED_WELL_COLOR
}

export type WellFill = Record<string, string>

export const wellFillFromWellContents = (
  wellContents: ContentsByWell,
  displayColors: string[]
): WellFill =>
  reduce(
    wellContents,
    (acc: WellFill, wellContents: WellContents, wellName: string) => {
      const wellFill = ingredIdsToColor(wellContents.groupIds, displayColors)
      return wellFill ? { ...acc, [wellName]: wellFill } : acc
    },
    {}
  )
