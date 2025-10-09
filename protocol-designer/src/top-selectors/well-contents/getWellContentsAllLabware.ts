import reduce from 'lodash/reduce'
import { createSelector } from 'reselect'

import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  getHighlightedWells,
  getSelectedWells,
} from '../../well-selection/selectors'

import type { WellGroup } from '@opentrons/components'
import type { LabwareDefinition2, LabwareWell } from '@opentrons/shared-data'
import type { SingleLabwareLiquidState } from '@opentrons/step-generation'
import type {
  ContentsByWell,
  WellContentsByLabware,
} from '../../labware-ingred/types'
import type { Selector } from '../../types'
import { getInitialRobotState } from '/protocol-designer/file-data/selectors'

const _getWellContents = (
  labwareDef: LabwareDefinition2,
  __ingredientsForContainer: SingleLabwareLiquidState,
  selectedWells: WellGroup | null | undefined,
  highlightedWells: WellGroup | null | undefined
): ContentsByWell => {
  // selectedWells and highlightedWells args may both be null,
  // they're only relevant to the selected container.
  const allWells = labwareDef.wells
  return reduce<LabwareDefinition2['wells'], ContentsByWell>(
    allWells,
    (
      acc: ContentsByWell,
      well: LabwareWell,
      wellName: string
    ): ContentsByWell => {
      const groupIds: string[] =
        __ingredientsForContainer && __ingredientsForContainer[wellName]
          ? Object.keys(__ingredientsForContainer[wellName])
          : []
      return {
        ...acc,
        [wellName]: {
          highlighted: highlightedWells ? wellName in highlightedWells : false,
          selected: selectedWells ? wellName in selectedWells : false,
          maxVolume: well.totalLiquidVolume,
          groupIds,
          ingreds: __ingredientsForContainer?.[wellName] || {},
        },
      }
    },
    {}
  )
}

export const getWellContentsAllLabware: Selector<WellContentsByLabware> = createSelector(
  stepFormSelectors.getLabwareEntities,
  getInitialRobotState,
  labwareIngredSelectors.getLiquidsByLabwareId,
  labwareIngredSelectors.getSelectedLabwareId,
  getSelectedWells,
  getHighlightedWells,

  (
    labwareEntities,
    initialRobotState,
    liquidsByLabware,
    selectedLabwareId,
    selectedWells,
    highlightedWells
  ) => {
    console.log('getInitialRobotState', initialRobotState)
    console.log('labwareEntities', labwareEntities)
    console.log('liquidsByLabware', liquidsByLabware)
    console.log('selectedLabwareId', selectedLabwareId)
    const selectedLabwareDefUri = selectedLabwareId ? initialRobotState.labware[selectedLabwareId].labwareDefURI : null
    console.log('selectedLabwareDefUri', selectedLabwareDefUri)
    const allLabwareIds: string[] = Object.keys(labwareEntities)
    return allLabwareIds.reduce(
      (
        acc: WellContentsByLabware,
        labwareId: string
      ): WellContentsByLabware => {
        const liquidsForLabware = liquidsByLabware[labwareId]
        const isSelectedLabware = selectedLabwareId === labwareId

        const wellContents = _getWellContents(
          labwareEntities[labwareId].def,
          liquidsForLabware, // Only give _getWellContents the selection data if it's a selected container
          isSelectedLabware ? selectedWells : null,
          isSelectedLabware ? highlightedWells : null
        )

        // Skip labware ids with no liquids
        return wellContents ? { ...acc, [labwareId]: wellContents } : acc
      },
      {}
    )
  }
)
