import { createSelector } from 'reselect'
import last from 'lodash/last'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniqBy from 'lodash/uniqBy'
import * as StepGeneration from '@opentrons/step-generation'
import { getAllWellsForLabware } from '../../constants'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import {
  selectors as stepFormSelectors,
  LabwareOnDeck,
  LabwareTemporalProperties,
  ModuleOnDeck,
  ModuleTemporalProperties,
  PipetteOnDeck,
  PipetteTemporalProperties,
} from '../../step-forms'
import { Substeps } from '../../steplist/types'
import { BaseState, Selector } from '../../types'
import { StepIdType } from '../../form-types'

// NOTE this just adds missing well keys to the labware-ingred 'deck setup' liquid state
export const getLabwareLiquidState: Selector<StepGeneration.LabwareLiquidState> = createSelector(
  labwareIngredSelectors.getLiquidsByLabwareId,
  stepFormSelectors.getLabwareEntities,
  (ingredLocations, labwareEntities) => {
    const allLabwareIds: string[] = Object.keys(labwareEntities)
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
    const labware: Record<string, LabwareTemporalProperties> = mapValues(
      initialDeckSetup.labware,
      (l: LabwareOnDeck): LabwareTemporalProperties => ({
        slot: l.slot,
      })
    )
    const pipettes: Record<string, PipetteTemporalProperties> = mapValues(
      initialDeckSetup.pipettes,
      (p: PipetteOnDeck): PipetteTemporalProperties => ({
        mount: p.mount,
      })
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

    case 'moveLabware': {
      return StepGeneration.curryCommandCreator(
        StepGeneration.moveLabware,
        args
      )
    }

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

    case 'waitForTemperature':
      return StepGeneration.curryCommandCreator(
        StepGeneration.waitForTemperature,
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
    case 'heaterShaker':
      return StepGeneration.curryCommandCreator(
        StepGeneration.heaterShaker,
        args
      )
  }
  // @ts-expect-error we've exhausted all command creators, but keeping this console warn
  // for when we impelement the next command creator
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
  [stepId in number | string]?: StepGeneration.CommandCreatorWarning[] | null
}
export const timelineWarningsPerStep: Selector<WarningsPerStep> = createSelector(
  stepFormSelectors.getOrderedStepIds,
  getRobotStateTimeline,
  (orderedStepIds, timeline) =>
    timeline.timeline.reduce((acc: WarningsPerStep, frame, timelineIndex) => {
      const stepId = orderedStepIds[timelineIndex]
      // remove warnings of duplicate 'type'. chosen arbitrarily
      return { ...acc, [stepId]: uniqBy(frame.warnings, w => w.type) }
    }, {})
)
export const getErrorStepId: Selector<
  StepIdType | null | undefined
> = createSelector(
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
