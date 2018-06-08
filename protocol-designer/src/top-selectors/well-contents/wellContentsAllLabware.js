// @flow
import {createSelector} from 'reselect'

import reduce from 'lodash/reduce'

import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import wellSelectionSelectors from '../../well-selection/selectors'

import type {Selector, JsonWellData, VolumeJson} from '../../types'
import type {Wells, AllWellContents} from '../../labware-ingred/types'
import {defaultContainers} from '../../constants.js'
import type {SingleLabwareLiquidState} from '../../step-generation'

const _getWellContents = (
  containerType: ?string,
  __ingredientsForContainer: SingleLabwareLiquidState,
  selectedWells: ?Wells,
  highlightedWells: ?Wells
): AllWellContents | null => {
  // selectedWells and highlightedWells args may both be null,
  // they're only relevant to the selected container.
  if (!containerType) {
    console.warn('_getWellContents called with no containerType, skipping')
    return null
  }

  const containerData: VolumeJson = defaultContainers.containers[containerType]
  if (!containerData) {
    console.warn('No data for container type ' + containerType)
    return null
  }

  const allLocations = containerData.locations

  return reduce(allLocations, (acc: AllWellContents, location: JsonWellData, wellName: string): AllWellContents => {
    const groupIds = (__ingredientsForContainer && __ingredientsForContainer[wellName])
      ? Object.keys(__ingredientsForContainer[wellName])
      : []

    return {
      ...acc,
      [wellName]: {
        highlighted: highlightedWells ? (wellName in highlightedWells) : false,
        selected: selectedWells ? wellName in selectedWells : false,
        maxVolume: location['total-liquid-volume'] || Infinity,
        groupIds
      }
    }
  }, {})
}

const wellContentsAllLabware: Selector<{[labwareId: string]: AllWellContents}> = createSelector(
  labwareIngredSelectors.getLabware,
  labwareIngredSelectors.getIngredientLocations,
  labwareIngredSelectors.getSelectedContainer,
  wellSelectionSelectors.getSelectedWells,
  wellSelectionSelectors.getHighlightedWells,
  (_labware, _ingredsByLabware, _selectedLabware, _selectedWells, _highlightedWells) => {
    const allLabwareIds: Array<string> = Object.keys(_labware) // TODO Ian 2018-05-29 weird flow error w/o annotation

    return allLabwareIds.reduce((acc: {[labwareId: string]: AllWellContents | null}, labwareId: string) => {
      const ingredsForLabware = _ingredsByLabware[labwareId]
      const isSelectedLabware = _selectedLabware && (_selectedLabware.id === labwareId)

      // Skip labware ids with no ingreds
      return {
        ...acc,
        [labwareId]: _getWellContents(
          _labware[labwareId].type,
          ingredsForLabware,
          // Only give _getWellContents the selection data if it's a selected container
          isSelectedLabware ? _selectedWells : null,
          isSelectedLabware ? _highlightedWells : null
        )
      }
    }, {})
  }
)

export default wellContentsAllLabware
