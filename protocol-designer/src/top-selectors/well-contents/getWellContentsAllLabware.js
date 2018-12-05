// @flow
import {createSelector} from 'reselect'

import reduce from 'lodash/reduce'

import {getLabware, type WellDefinition} from '@opentrons/shared-data'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import wellSelectionSelectors from '../../well-selection/selectors'

import type {Selector} from '../../types'
import type {
  Wells,
  ContentsByWell,
  WellContentsByLabware,
} from '../../labware-ingred/types'
import type {SingleLabwareLiquidState} from '../../step-generation'

const _getWellContents = (
  containerType: ?string,
  __ingredientsForContainer: SingleLabwareLiquidState,
  selectedWells: ?Wells,
  highlightedWells: ?Wells
): ContentsByWell | null => {
  // selectedWells and highlightedWells args may both be null,
  // they're only relevant to the selected container.
  if (!containerType) {
    console.warn('_getWellContents called with no containerType, skipping')
    return null
  }

  const containerData = getLabware(containerType)
  if (!containerData) {
    console.warn('No data for container type ' + containerType)
    return null
  }

  const allWells = containerData.wells

  return reduce(allWells, (acc: ContentsByWell, well: WellDefinition, wellName: string): ContentsByWell => {
    const groupIds = (__ingredientsForContainer && __ingredientsForContainer[wellName])
      ? Object.keys(__ingredientsForContainer[wellName])
      : []

    return {
      ...acc,
      [wellName]: {
        highlighted: highlightedWells ? (wellName in highlightedWells) : false,
        selected: selectedWells ? wellName in selectedWells : false,
        maxVolume: well['total-liquid-volume'] || Infinity,
        groupIds,
        ingreds: __ingredientsForContainer && __ingredientsForContainer[wellName],
      },
    }
  }, {})
}

const getWellContentsAllLabware: Selector<WellContentsByLabware> = createSelector(
  labwareIngredSelectors.getLabwareById,
  labwareIngredSelectors.getLiquidsByLabwareId,
  labwareIngredSelectors.getSelectedLabware,
  wellSelectionSelectors.getSelectedWells,
  wellSelectionSelectors.getHighlightedWells,
  (labwareById, liquidsByLabware, selectedLabware, selectedWells, highlightedWells) => {
    const allLabwareIds: Array<string> = Object.keys(labwareById) // TODO Ian 2018-05-29 weird flow error w/o annotation

    return allLabwareIds.reduce((acc: {[labwareId: string]: ContentsByWell | null}, labwareId: string) => {
      const liquidsForLabware = liquidsByLabware[labwareId]
      const isSelectedLabware = selectedLabware && (selectedLabware.id === labwareId)

      // Skip labware ids with no liquids
      return {
        ...acc,
        [labwareId]: _getWellContents(
          labwareById[labwareId] && labwareById[labwareId].type,
          liquidsForLabware,
          // Only give _getWellContents the selection data if it's a selected container
          isSelectedLabware ? selectedWells : null,
          isSelectedLabware ? highlightedWells : null
        ),
      }
    }, {})
  }
)

export default getWellContentsAllLabware
