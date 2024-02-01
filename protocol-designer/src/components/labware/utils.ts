import reduce from 'lodash/reduce'
import { AdditionalEquipmentEntities, AIR } from '@opentrons/step-generation'
import { WellFill } from '@opentrons/components'
import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'
import { swatchColors, MIXED_WELL_COLOR } from '../swatchColors'
import { ContentsByWell, WellContents } from '../../labware-ingred/types'

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

export const getHasWasteChute = (
  additionalEquipmentEntities: AdditionalEquipmentEntities
): boolean => {
  return Object.values(additionalEquipmentEntities).some(
    additionalEquipmentEntity =>
      additionalEquipmentEntity.location === WASTE_CHUTE_CUTOUT &&
      additionalEquipmentEntity.name === 'wasteChute'
  )
}
