import last from 'lodash/last'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniqBy from 'lodash/uniqBy'
import { createSelector } from 'reselect'

import { getIsLid, getIsPipettableLabware } from '@opentrons/shared-data'
import * as StepGeneration from '@opentrons/step-generation'
import {
  getNearestParentInStack,
  TOUCHED_PIPETTABLE_LABWARE,
} from '@opentrons/step-generation'

import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'

import type { ModuleTemporalProperties } from '@opentrons/step-generation'
import type { StepIdType } from '../../form-types'
import type {
  LabwareTemporalProperties,
  ModuleOnDeck,
  PipetteOnDeck,
  PipetteTemporalProperties,
} from '../../step-forms'
import type { Substeps } from '../../steplist/types'
import type { BaseState, Selector } from '../../types'

// NOTE this just adds missing well keys to the labware-ingred 'deck setup' liquid state
export const getLabwareLiquidState = createSelector(
  labwareIngredSelectors.getLiquidsByLabwareId,
  stepFormSelectors.getLabwareEntities,
  (ingredLocations, labwareEntities): StepGeneration.LabwareLiquidState => {
    const allLabwareIds: string[] = Object.keys(labwareEntities)
    return allLabwareIds.reduce(
      (
        acc: StepGeneration.LabwareLiquidState,
        labwareId
      ): StepGeneration.LabwareLiquidState => {
        const labwareDef = labwareEntities[labwareId].def
        const allWells = labwareDef
          ? StepGeneration.getAllWellsForLabware(labwareDef)
          : []
        const liquidStateForLabwareAllWells = allWells.reduce(
          (innerAcc: StepGeneration.SingleLabwareLiquidState, well) => ({
            ...innerAcc,
            [well]:
              (ingredLocations[labwareId] &&
                ingredLocations[labwareId][well]) ||
              {},
          }),
          {}
        )
        return { ...acc, [labwareId]: liquidStateForLabwareAllWells }
      },
      {}
    )
  }
)
export const getInitialRobotState: (
  arg0: BaseState
) => StepGeneration.RobotState = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  stepFormSelectors.getInvariantContext,
  getLabwareLiquidState,
  (initialDeckSetup, invariantContext, labwareLiquidState) => {
    const pipettes: Record<string, PipetteTemporalProperties> = mapValues(
      initialDeckSetup.pipettes,
      (p: PipetteOnDeck): PipetteTemporalProperties => ({
        mount: p.mount,
      })
    )
    const labware: Record<string, LabwareTemporalProperties> = mapValues(
      initialDeckSetup.labware,
      ({ id, stack, stackedOnNode, contains }): LabwareTemporalProperties => {
        const labwareEntity = invariantContext.labwareEntities[id]
        const isLid = getIsLid(labwareEntity.def)
        const nearestParent = getNearestParentInStack(stack)
        const isParentPipettableLabware =
          nearestParent != null &&
          nearestParent in invariantContext.labwareEntities &&
          getIsPipettableLabware(
            invariantContext.labwareEntities[nearestParent].def
          )
        return {
          stack,
          ...(stackedOnNode != null ? { stackedOnNode } : {}),
          ...(contains != null ? { contains } : {}),
          // set sterility to TOUCHED_PIPETTABLE_LABWARE if the labware is a lid and the parent is pipettable labware
          ...(isLid && isParentPipettableLabware
            ? { sterility: TOUCHED_PIPETTABLE_LABWARE }
            : {}),
        }
      }
    )
    const modules: Record<string, ModuleTemporalProperties> = mapValues(
      initialDeckSetup.modules,
      (m: ModuleOnDeck): ModuleTemporalProperties => {
        return omit(m, ['id', 'type', 'model'])
      }
    )
    const robotState = StepGeneration.makeInitialRobotState({
      invariantContext,
      labwareLocations: labware,
      moduleLocations: modules,
      pipetteLocations: pipettes,
    })
    robotState.liquidState.labware = labwareLiquidState
    return StepGeneration.enrichRobotStateForStackGraphTraversals(
      robotState,
      invariantContext.moduleEntities,
      invariantContext.labwareEntities
    )
  }
)

export const getTimelineIsBeingComputed: Selector<boolean> = state =>
  state.fileData.timelineIsBeingComputed
// exposes errors and last valid robotState
export const getRobotStateTimeline: Selector<StepGeneration.Timeline> = state =>
  state.fileData.computedRobotStateTimeline
export const getSubsteps: Selector<Substeps> = state =>
  state.fileData.computedSubsteps
type WarningsPerStep = {
  [stepId in number | string]?: StepGeneration.CommandCreatorWarning[] | null
}
export const timelineWarningsPerStep: Selector<WarningsPerStep> =
  createSelector(
    stepFormSelectors.getOrderedStepIds,
    getRobotStateTimeline,
    (orderedStepIds, timeline) =>
      timeline.timeline.reduce((acc: WarningsPerStep, frame, timelineIndex) => {
        const stepId = orderedStepIds[timelineIndex]
        // remove warnings of duplicate 'type'. chosen arbitrarily
        return { ...acc, [stepId]: uniqBy(frame.warnings, w => w.type) }
      }, {})
  )
export const getErrorStepId: Selector<StepIdType | null | undefined> =
  createSelector(
    stepFormSelectors.getOrderedStepIds,
    getRobotStateTimeline,
    (orderedStepIds, timeline) => {
      const hasErrors = timeline.errors && timeline.errors.length > 0

      if (hasErrors) {
        // the frame *after* the last frame in the timeline is the error-throwing one
        const errorIndex = timeline.timeline.length
        const errorStepId = orderedStepIds[errorIndex]
        return errorStepId
      }

      return null
    }
  )
export const lastValidRobotState: Selector<StepGeneration.RobotState> =
  createSelector(
    getRobotStateTimeline,
    getInitialRobotState,
    (timeline, initialRobotState) => {
      const lastTimelineFrame = last(timeline.timeline)
      return (
        (lastTimelineFrame && lastTimelineFrame.robotState) || initialRobotState
      )
    }
  )
