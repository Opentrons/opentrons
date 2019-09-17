// @flow
import { createSelector } from 'reselect'
import last from 'lodash/last'
import mapValues from 'lodash/mapValues'
import takeWhile from 'lodash/takeWhile'
import uniqBy from 'lodash/uniqBy'
import { getAllWellsForLabware } from '../../constants'
import * as StepGeneration from '../../step-generation'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import type { BaseState, Selector } from '../../types'
import type { StepIdType } from '../../form-types'
import type {
  LabwareOnDeck,
  PipetteOnDeck,
  LabwareTemporalProperties,
  PipetteTemporalProperties,
} from '../../step-forms'

const getInvariantContext: Selector<StepGeneration.InvariantContext> = createSelector(
  stepFormSelectors.getLabwareEntities,
  stepFormSelectors.getPipetteEntities,
  (labwareEntities, pipetteEntities) => ({ labwareEntities, pipetteEntities })
)

// NOTE this just adds missing well keys to the labware-ingred 'deck setup' liquid state
export const getLabwareLiquidState: Selector<StepGeneration.LabwareLiquidState> = createSelector(
  labwareIngredSelectors.getLiquidsByLabwareId,
  stepFormSelectors.getLabwareEntities,
  (ingredLocations, labwareEntities) => {
    const allLabwareIds: Array<string> = Object.keys(labwareEntities)
    return allLabwareIds.reduce(
      (
        acc: StepGeneration.LabwareLiquidState,
        labwareId
      ): StepGeneration.LabwareLiquidState => {
        const labwareDef = labwareEntities[labwareId].def
        const allWells = labwareDef ? getAllWellsForLabware(labwareDef) : []
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
        return {
          ...acc,
          [labwareId]: liquidStateForLabwareAllWells,
        }
      },
      {}
    )
  }
)

export const getInitialRobotState: BaseState => StepGeneration.RobotState = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  stepFormSelectors.getInvariantContext,
  getLabwareLiquidState,
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

    const robotState = StepGeneration.makeInitialRobotState({
      invariantContext,
      labwareLocations: labware,
      pipetteLocations: pipettes,
    })
    robotState.liquidState.labware = labwareLiquidState
    return robotState
  }
)

function compoundCommandCreatorFromStepArgs(
  stepArgs: StepGeneration.CommandCreatorArgs
): ?StepGeneration.CompoundCommandCreator {
  switch (stepArgs.commandCreatorFnName) {
    case 'consolidate':
      return StepGeneration.consolidate(stepArgs)
    case 'delay': {
      // TODO(Ian 2019-01-29): homogenize compound vs non-compound command
      // creator type, maybe flow will get un-confused here
      // TODO(mc, 2019-04-09): these typedefs should probably be exact objects
      // (like redux actions) to have this switch block behave
      return prevRobotState => [
        // TODO: Ian 2019-04-18 this is a HACK the make delay work here, until compound vs non-compound cc types are merged
        (invariantContext, prevRobotState) =>
          // $FlowFixMe: TODOs above ^^^
          StepGeneration.delay(stepArgs)(invariantContext, prevRobotState),
      ]
    }
    case 'distribute':
      return StepGeneration.distribute(stepArgs)
    case 'transfer':
      return StepGeneration.transfer(stepArgs)
    case 'mix':
      return StepGeneration.mix(stepArgs)
  }
  console.warn(
    `unhandled commandCreatorFnName: ${stepArgs.commandCreatorFnName}`
  )
  return null
}

// exposes errors and last valid robotState
export const getRobotStateTimeline: Selector<StepGeneration.Timeline> = createSelector(
  stepFormSelectors.getArgsAndErrorsByStepId,
  stepFormSelectors.getOrderedStepIds,
  getInitialRobotState,
  getInvariantContext,
  (
    allStepArgsAndErrors,
    orderedStepIds,
    initialRobotState,
    invariantContext
  ) => {
    const allStepArgs: Array<StepGeneration.CommandCreatorArgs | null> = orderedStepIds.map(
      stepId => {
        return (
          (allStepArgsAndErrors[stepId] &&
            allStepArgsAndErrors[stepId].stepArgs) ||
          null
        )
      }
    )

    // TODO: Ian 2018-06-14 `takeWhile` isn't inferring the right type
    // $FlowFixMe
    const continuousStepArgs: Array<StepGeneration.CommandCreatorArgs> = takeWhile(
      allStepArgs,
      stepArgs => stepArgs
    )

    const commandCreators = continuousStepArgs.reduce(
      (acc: Array<StepGeneration.CommandCreator>, stepArgs, stepIndex) => {
        let reducedCommandCreator = null

        const compoundCommandCreator: ?StepGeneration.CompoundCommandCreator = compoundCommandCreatorFromStepArgs(
          stepArgs
        )
        reducedCommandCreator =
          compoundCommandCreator &&
          StepGeneration.reduceCommandCreators(
            compoundCommandCreator(invariantContext, initialRobotState)
          )

        if (!reducedCommandCreator) {
          console.warn(
            `commandCreatorFnName "${
              stepArgs.commandCreatorFnName
            }" not yet implemented for robotStateTimeline`
          )
          return acc
        }

        // Drop tips eagerly, per pipette
        // NOTE: this assumes all step forms that use a pipette have both
        // 'pipette' and 'changeTip' fields (and they're not named something else).
        const pipetteId = stepArgs.pipette
        if (pipetteId) {
          const nextStepArgsForPipette = continuousStepArgs
            .slice(stepIndex + 1)
            .find(stepArgs => stepArgs.pipette === pipetteId)

          const willReuseTip =
            nextStepArgsForPipette &&
            nextStepArgsForPipette.changeTip === 'never'
          if (!willReuseTip) {
            return [
              ...acc,
              StepGeneration.reduceCommandCreators([
                reducedCommandCreator,
                StepGeneration.dropTip(pipetteId),
              ]),
            ]
          }
        }

        return [...acc, reducedCommandCreator]
      },
      []
    )

    const timeline = StepGeneration.commandCreatorsTimeline(commandCreators)(
      invariantContext,
      initialRobotState
    )

    return timeline
  }
)

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
