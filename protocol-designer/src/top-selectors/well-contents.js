// @flow
import {createSelector} from 'reselect'

import mapValues from 'lodash/mapValues'

import reduce from 'lodash/reduce'
import * as StepGeneration from '../step-generation'
import {selectors as steplistSelectors} from '../steplist/reducers'
import {selectors as fileDataSelectors} from '../file-data'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {getAllWellsForLabware} from '../constants'

import type {Selector} from '../types'
import type {WellContents, AllWellContents} from '../labware-ingred/types'
import type {NamedIngredsByLabwareAllSteps} from '../steplist/types'

type SingleLabwareLiquidState = {[well: string]: StepGeneration.LocationLiquidState}

function _wellContentsForWell (
  liquidVolState: StepGeneration.LocationLiquidState,
  well: string
): WellContents {
  // TODO IMMEDIATELY Ian 2018-03-23 why is liquidVolState missing sometimes (eg first call with trashId)? Thus the liquidVolState || {}
  const ingredGroupIdsWithContent = Object.keys(liquidVolState || {}).filter(groupId =>
      liquidVolState[groupId] &&
      liquidVolState[groupId].volume > 0
    )

  return {
    preselected: false,
    selected: false,
    highlighted: false,
    maxVolume: Infinity, // TODO Ian 2018-03-23 refactor so all these fields aren't needed
    wellName: well,
    groupIds: ingredGroupIdsWithContent
  }
}

function _wellContentsForLabware (
  labwareLiquids: SingleLabwareLiquidState,
  labwareId: string,
  labwareType: string
): AllWellContents {
  const allWellsForContainer = getAllWellsForLabware(labwareType)

  return reduce(
    allWellsForContainer,
    (wellAcc, well: string): {[well: string]: WellContents} => ({
      ...wellAcc,
      [well]: _wellContentsForWell(labwareLiquids[well], well)
    }),
    {}
  )
}

export const allWellContentsForSteps: Selector<Array<{[labwareId: string]: AllWellContents}>> = createSelector(
  fileDataSelectors.robotStateTimeline,
  steplistSelectors.validatedForms,
  (_robotStateTimeline, _forms) => {
    const liquidStateTimeline = _robotStateTimeline.map(t => t.robotState.liquidState.labware)

    return liquidStateTimeline.map(
      (liquidState, timelineIdx) => mapValues(
        liquidState,
        (labwareLiquids: SingleLabwareLiquidState, labwareId: string) => {
          const robotState = _robotStateTimeline[timelineIdx].robotState
          const labwareType = robotState.labware[labwareId].type

          return _wellContentsForLabware(
            labwareLiquids,
            labwareId,
            labwareType
          )
        }
      )
    )
  }
)

/** NamedIngred-formatted contents of wells, across all steps on the timeline */
export const namedIngredsByLabware: Selector<NamedIngredsByLabwareAllSteps> = createSelector(
  allWellContentsForSteps,
  labwareIngredSelectors.getIngredientGroups,
  (_allWellContentsForSteps, _ingredientGroups) =>
    _allWellContentsForSteps.map(stepWellContents =>
      mapValues(stepWellContents, (labwareContents: AllWellContents, labwareId: string) =>
        mapValues(labwareContents, (wellContents: WellContents, wellId: string) => {
          return wellContents.groupIds
            .filter(id => id in _ingredientGroups) // strip out __air__, etc pseudo-ingreds not in ingredientGroups
            .map(id => ({
              id: parseInt(id),
              name: _ingredientGroups[id].name
              // NOTE: serializeName is available too, but is being deprecated?
            }))
        })
      )
    )
)
