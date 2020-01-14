// @flow
import { createSelector } from 'reselect'
import last from 'lodash/last'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import takeWhile from 'lodash/takeWhile'
import uniqBy from 'lodash/uniqBy'
import { getAllWellsForLabware } from '../../constants'
import * as StepGeneration from '../../step-generation'
import { selectors as featureFlagSelectors } from '../../feature-flags'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
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

const getInvariantContext: Selector<StepGeneration.InvariantContext> = createSelector(
  stepFormSelectors.getLabwareEntities,
  stepFormSelectors.getModuleEntities,
  stepFormSelectors.getPipetteEntities,
  (labwareEntities, moduleEntities, pipetteEntities) => ({
    labwareEntities,
    moduleEntities,
    pipetteEntities,
  })
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
    robotState.liquidState.labware = labwareLiquidState
    return robotState
  }
)

const commandCreatorFromStepArgs = (
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
  }
  console.warn(`unhandled commandCreatorFnName: ${args.commandCreatorFnName}`)
  return null
}

// exposes errors and last valid robotState
export const getRobotStateTimeline: Selector<StepGeneration.Timeline> = createSelector(
  stepFormSelectors.getArgsAndErrorsByStepId,
  stepFormSelectors.getOrderedStepIds,
  getInitialRobotState,
  getInvariantContext,
  featureFlagSelectors.getFeatureFlagData,
  (
    allStepArgsAndErrors,
    orderedStepIds,
    initialRobotState,
    invariantContext,
    featureFlagMemoizationBust // HACK Ian 2019-11-12: this isn't used directly,
    // it's only included to bust this selector's memoization. Required b/c step-generation's `getFeatureFlag` util
    // must read directly from localStorage. Once getDisableModuleRestrictions aka "rogue mode"
    // is removed, we can remove this arg to this selector.
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

    const curriedCommandCreators = continuousStepArgs.reduce(
      (
        acc: Array<StepGeneration.CurriedCommandCreator>,
        args: StepGeneration.CommandCreatorArgs,
        stepIndex
      ): Array<StepGeneration.CurriedCommandCreator> => {
        const curriedCommandCreator = commandCreatorFromStepArgs(args)

        if (curriedCommandCreator === null) {
          // unsupported command creator in args.commandCreatorFnName
          return acc
        }

        // Drop tips eagerly, per pipette
        //
        // - If we don't have a 'changeTip: never' step for this pipette in the future,
        // we know the current tip(s) aren't going to be reused, so we can drop them
        // immediately after the current step is done.
        //
        // NOTE: this implementation assumes all step forms that use a pipette have both
        // 'pipette' and 'changeTip' fields (and they're not named something else).
        const pipetteId =
          args.commandCreatorFnName !== 'delay' &&
          args.commandCreatorFnName !== 'engageMagnet' &&
          args.commandCreatorFnName !== 'disengageMagnet' &&
          args.commandCreatorFnName !== 'setTemperature' &&
          args.commandCreatorFnName !== 'deactivateTemperature'
            ? args.pipette
            : false
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
              (_invariantContext, _prevRobotState) =>
                StepGeneration.reduceCommandCreators(
                  [
                    curriedCommandCreator,
                    StepGeneration.curryCommandCreator(StepGeneration.dropTip, {
                      pipette: pipetteId,
                    }),
                  ],
                  _invariantContext,
                  _prevRobotState
                ),
            ]
          }
        }
        return [...acc, curriedCommandCreator]
      },
      []
    )

    const timeline = StepGeneration.commandCreatorsTimeline(
      curriedCommandCreators,
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
