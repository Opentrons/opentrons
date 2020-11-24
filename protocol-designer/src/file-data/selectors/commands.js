// @flow
import { createSelector } from 'reselect'
import last from 'lodash/last'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniqBy from 'lodash/uniqBy'
import * as StepGeneration from '../../step-generation'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import type { Substeps } from '../../steplist/types'
import type { BaseState, Selector } from '../../types'
import type { StepIdType } from '../../form-types'
import type {
  LabwareOnDeck,
  LabwareTemporalProperties,
  ModuleOnDeck,
  ModuleTemporalProperties,
  PipetteOnDeck,
  PipetteTemporalProperties,
} from '../../step-forms'

export const getInitialRobotState: BaseState => StepGeneration.RobotState = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  stepFormSelectors.getInvariantContext,
  labwareIngredSelectors.getLiquidsByLabwareId,
  (initialDeckSetup, invariantContext, labwareLiquidState) => {
    const labware: {
      [labwareId: string]: LabwareTemporalProperties,
    } = mapValues(
      initialDeckSetup.labware,
      (l: LabwareOnDeck): LabwareTemporalProperties => ({
        slot: l.slot,
      })
    )

    const pipettes: {
      [pipetteId: string]: PipetteTemporalProperties,
    } = mapValues(
      initialDeckSetup.pipettes,
      (p: PipetteOnDeck): PipetteTemporalProperties => ({
        mount: p.mount,
      })
    )

    const modules: {
      [moduleId: string]: ModuleTemporalProperties,
    } = mapValues(
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
    // TODO IMMEDIATELY: this SHOULD be adding only empty labware keys (eg `trashId: {}` is not in labwareLiquidState)
    // Trace better and see if you can do it more elegantly.
    // Before, it was `robotState.liquidState.labware = labwareLiquidState`
    robotState.liquidState.labware = {
      ...robotState.liquidState.labware,
      ...labwareLiquidState,
    }

    return robotState
  }
)

export const commandCreatorFromStepArgs = (
  args: StepGeneration.CommandCreatorArgs
): StepGeneration.CurriedCommandCreator | null => {
  switch (args.commandCreatorFnName) {
    case 'consolidate': {
      return StepGeneration.curryCommandCreator(
        StepGeneration.consolidate,
        args
      )
    }
    case 'delay': {
      return StepGeneration.curryCommandCreator(StepGeneration.delay, args)
    }
    case 'distribute':
      return StepGeneration.curryCommandCreator(StepGeneration.distribute, args)
    case 'transfer':
      return StepGeneration.curryCommandCreator(StepGeneration.transfer, args)
    case 'mix':
      return StepGeneration.curryCommandCreator(StepGeneration.mix, args)
    case 'engageMagnet':
      return StepGeneration.curryCommandCreator(
        StepGeneration.engageMagnet,
        args
      )
    case 'disengageMagnet':
      return StepGeneration.curryCommandCreator(
        StepGeneration.disengageMagnet,
        args
      )
    case 'setTemperature':
      return StepGeneration.curryCommandCreator(
        StepGeneration.setTemperature,
        args
      )
    case 'deactivateTemperature':
      return StepGeneration.curryCommandCreator(
        StepGeneration.deactivateTemperature,
        args
      )
    case 'awaitTemperature':
      return StepGeneration.curryCommandCreator(
        StepGeneration.awaitTemperature,
        args
      )
    case 'thermocyclerProfile':
      return StepGeneration.curryCommandCreator(
        StepGeneration.thermocyclerProfileStep,
        args
      )
    case 'thermocyclerState':
      return StepGeneration.curryCommandCreator(
        StepGeneration.thermocyclerStateStep,
        args
      )
  }
  console.warn(`unhandled commandCreatorFnName: ${args.commandCreatorFnName}`)
  return null
}

export const getTimelineIsBeingComputed: Selector<boolean> = state =>
  state.fileData.timelineIsBeingComputed

// exposes errors and last valid robotState
export const getRobotStateTimeline: Selector<StepGeneration.Timeline> = state =>
  state.fileData.computedRobotStateTimeline

export const getSubsteps: Selector<Substeps> = state =>
  state.fileData.computedSubsteps

type WarningsPerStep = {
  [stepId: number | string]: ?Array<StepGeneration.CommandCreatorWarning>,
}
export const timelineWarningsPerStep: Selector<WarningsPerStep> = createSelector(
  stepFormSelectors.getOrderedStepIds,
  getRobotStateTimeline,
  (orderedStepIds, timeline) =>
    timeline.timeline.reduce((acc: WarningsPerStep, frame, timelineIndex) => {
      const stepId = orderedStepIds[timelineIndex]

      // remove warnings of duplicate 'type'. chosen arbitrarily
      return {
        ...acc,
        [stepId]: uniqBy(frame.warnings, w => w.type),
      }
    }, {})
)

export const getErrorStepId: Selector<?StepIdType> = createSelector(
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

export const lastValidRobotState: Selector<StepGeneration.RobotState> = createSelector(
  getRobotStateTimeline,
  getInitialRobotState,
  (timeline, initialRobotState) => {
    const lastTimelineFrame = last(timeline.timeline)
    return (
      (lastTimelineFrame && lastTimelineFrame.robotState) || initialRobotState
    )
  }
)
