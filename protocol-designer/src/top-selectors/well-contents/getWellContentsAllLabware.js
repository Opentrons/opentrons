// @flow
import { createSelector } from 'reselect'

import reduce from 'lodash/reduce'

import type { WellGroup } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import {
  getSelectedWells,
  getHighlightedWells,
} from '../../well-selection/selectors'

import type { Selector } from '../../types'
import type {
  ContentsByWell,
  WellContentsByLabware,
} from '../../labware-ingred/types'
import type { SingleLabwareLiquidState } from '../../step-generation'

const _getWellContents = (
  labwareDef: LabwareDefinition2,
  __ingredientsForContainer: SingleLabwareLiquidState,
  selectedWells: ?WellGroup,
  highlightedWells: ?WellGroup
): ContentsByWell | null => {
  // selectedWells and highlightedWells args may both be null,
  // they're only relevant to the selected container.
  const allWells = labwareDef.wells

  return reduce(
    allWells,
    (
      acc: ContentsByWell,
      well: $PropertyType<LabwareDefinition2, 'wells'>,
      wellName: string
    ): ContentsByWell => {
      const groupIds: Array<string> =
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
  labwareIngredSelectors.getLiquidsByLabwareId,
  labwareIngredSelectors.getSelectedLabwareId,
  getSelectedWells,
  getHighlightedWells,
  (
    labwareEntities,
    liquidsByLabware,
    selectedLabwareId,
    selectedWells,
    highlightedWells
  ) => {
    // TODO: Ian 2019-02-14 weird flow error without explicit Array<string> annotation
    const allLabwareIds: Array<string> = Object.keys(labwareEntities)

    return allLabwareIds.reduce(
      (
        acc: WellContentsByLabware,
        labwareId: string
      ): WellContentsByLabware => {
        const liquidsForLabware = liquidsByLabware[labwareId]
        const isSelectedLabware = selectedLabwareId === labwareId

        const wellContents = _getWellContents(
          labwareEntities[labwareId].def,
          liquidsForLabware,
          // Only give _getWellContents the selection data if it's a selected container
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
