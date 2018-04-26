// @flow
import {createSelector} from 'reselect'

import reduce from 'lodash/reduce'

import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import wellSelectionSelectors from '../../well-selection/selectors'

import type {Selector, JsonWellData, VolumeJson} from '../../types'
import type {Wells, AllWellContents, IngredsForLabware} from '../../labware-ingred/types'
import type {LabwareData} from '../../step-generation'
import {defaultContainers} from '../../constants.js'

const _getWellContents = (
  containerType: ?string,
  __ingredientsForContainer: IngredsForLabware,
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

  const allIngredGroupIds = Object.keys(__ingredientsForContainer)

  function groupIdsForWell (wellName: string): Array<string> {
    return allIngredGroupIds.filter((groupId: string) =>
      __ingredientsForContainer[groupId] &&
      __ingredientsForContainer[groupId].wells &&
      __ingredientsForContainer[groupId].wells[wellName]
    )
  }

  return reduce(allLocations, (acc: AllWellContents, location: JsonWellData, wellName: string): AllWellContents => {
    const groupIds = groupIdsForWell(wellName)

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
  labwareIngredSelectors.ingredientsByLabware,
  labwareIngredSelectors.getSelectedContainer,
  wellSelectionSelectors.getSelectedWells,
  wellSelectionSelectors.getHighlightedWells,
  (_labware: {[id: string]: LabwareData}, _ingredsByLabware, _selectedLabware, _selectedWells, _highlightedWells) => {
    const allLabwareIds = Object.keys(_labware)

    return allLabwareIds.reduce((acc: {[labwareId: string]: AllWellContents | null}, labwareId: string) => {
      const ingredsForLabware = _ingredsByLabware[labwareId]
      const isSelectedLabware = _selectedLabware && (_selectedLabware.containerId === labwareId)
      // Skip labware ids with no ingreds
      return {
        ...acc,
        [labwareId]: (ingredsForLabware)
          ? _getWellContents(
          _labware[labwareId].type,
          ingredsForLabware,
          // Only give _getWellContents the selection data if it's a selected container
          isSelectedLabware ? _selectedWells : null,
          isSelectedLabware ? _highlightedWells : null
        )
        : null
      }
    }, {})
  }
)

export default wellContentsAllLabware
