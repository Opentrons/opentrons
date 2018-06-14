// @flow
import {createSelector} from 'reselect'
import last from 'lodash/last'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import takeWhile from 'lodash/takeWhile'
import type {BaseState, Selector} from '../../types'
import {getAllWellsForLabware} from '../../constants'
import * as StepGeneration from '../../step-generation'
import {selectors as steplistSelectors} from '../../steplist/reducers'
import {equippedPipettes} from './pipettes'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import type {Labware} from '../../labware-ingred/types'

const all96Tips = reduce(
  StepGeneration.tiprackWellNamesFlat,
  (acc: {[string]: boolean}, wellName: string) => ({...acc, [wellName]: true}),
  {}
)

// NOTE this just adds missing well keys to the labware-ingred 'deck setup' liquid state
export const getLabwareLiquidState: Selector<StepGeneration.LabwareLiquidState> = createSelector(
  labwareIngredSelectors.getIngredientLocations,
  labwareIngredSelectors.getLabware,
  (ingredLocations, allLabware) => {
    const allLabwareIds: Array<string> = Object.keys(allLabware)
    return allLabwareIds.reduce((
      acc: StepGeneration.LabwareLiquidState,
      labwareId
    ): StepGeneration.LabwareLiquidState => {
      const allWells = getAllWellsForLabware(allLabware[labwareId].type)
      const liquidStateForLabwareAllWells = allWells.reduce(
        (innerAcc: StepGeneration.SingleLabwareLiquidState, well) => ({
          ...innerAcc,
          [well]: (ingredLocations[labwareId] && ingredLocations[labwareId][well]) || {}
        }),
        {}
      )
      return {
        ...acc,
        [labwareId]: liquidStateForLabwareAllWells
      }
    }, {})
  }
)

function labwareConverter (labwareAppState: {[labwareId: string]: Labware}): {[labwareId: string]: StepGeneration.LabwareData} {
  // Convert internal PD labware objects into JSON spec labware objects
  // (just removes keys & makes flow happy)
  return mapValues(labwareAppState, (l: Labware): StepGeneration.LabwareData => ({
    name: l.name,
    type: l.type,
    slot: l.slot
  }))
}

export const getInitialRobotState: BaseState => StepGeneration.RobotState = createSelector(
  equippedPipettes,
  labwareIngredSelectors.getLabware,
  getLabwareLiquidState,
  (pipettes, labwareAppState, labwareLiquidState) => {
    type TipState = $PropertyType<StepGeneration.RobotState, 'tipState'>
    type TiprackTipState = $PropertyType<TipState, 'tipracks'>

    const labware = labwareConverter(labwareAppState)

    const tipracks: TiprackTipState = reduce(
      labware,
      (acc: TiprackTipState, labwareData: StepGeneration.LabwareData, labwareId: string) => {
        // TODO Ian 2018-05-18 have a more robust way of designating labware types
        // as tiprack or not
        if (labwareData.type && labwareData.type.startsWith('tiprack')) {
          return {
            ...acc,
            // TODO LATER Ian 2018-05-18 use shared-data wells instead of assuming 96 tips?
            [labwareId]: {...all96Tips}
          }
        }
        return acc
      },
      {})

    type PipetteTipState = {[pipetteId: string]: boolean}
    const pipetteTipState: PipetteTipState = reduce(
      pipettes,
      (acc: PipetteTipState, pipetteData: StepGeneration.PipetteData) =>
        ({
          ...acc,
          [pipetteData.id]: false // start with no tips
        }),
      {})

    const pipetteLiquidState = reduce(
      pipettes,
      (acc, pipetteData: StepGeneration.PipetteData, pipetteId: string) => ({
        ...acc,
        [pipetteId]: (pipetteData.channels > 1)
          ? {'0': {}, '1': {}, '2': {}, '3': {}, '4': {}, '5': {}, '6': {}, '7': {}}
          : {'0': {}}
      }),
    {})

    return {
      instruments: pipettes,
      labware,
      tipState: {
        tipracks,
        pipettes: pipetteTipState
      },
      liquidState: {
        pipettes: pipetteLiquidState,
        labware: labwareLiquidState
      }
    }
  }
)

function commandCreatorsFromFormData (validatedForm: StepGeneration.CommandCreatorData) {
  if (validatedForm.stepType === 'consolidate') {
    return StepGeneration.consolidate(validatedForm)
  } else
  if (validatedForm.stepType === 'transfer') {
    return StepGeneration.transfer(validatedForm)
  } else
  if (validatedForm.stepType === 'distribute') {
    return StepGeneration.distribute(validatedForm)
  } else
  if (validatedForm.stepType === 'pause') {
    return StepGeneration.delay(validatedForm)
  } else
  if (validatedForm.stepType === 'mix') {
    return StepGeneration.mix(validatedForm)
  }

  return null
}

// exposes errors and last valid robotState
export const robotStateTimeline: Selector<StepGeneration.Timeline> = createSelector(
  steplistSelectors.validatedForms,
  steplistSelectors.orderedSteps,
  getInitialRobotState,
  (forms, orderedStepsWithDeckSetup, initialRobotState) => {
    const orderedSteps = orderedStepsWithDeckSetup.slice(1)
    const allFormData: Array<StepGeneration.CommandCreatorData | null> = orderedSteps.map(stepId => {
      return (forms[stepId] && forms[stepId].validatedForm) || null
    }, [])

    // TODO: Ian 2018-06-14 `takeWhile` isn't inferring the right type
    // $FlowFixMe
    const continuousValidForms: Array<StepGeneration.CommandCreatorData> = takeWhile(
      allFormData,
      f => f
    )

    const commandCreators = continuousValidForms.reduce(
      (acc: Array<StepGeneration.CommandCreator>, formData) => {
        const {stepType} = formData
        const commandCreator = commandCreatorsFromFormData(formData)

        if (!commandCreator) {
          // TODO Ian 2018-05-08 use assert
          console.warn(`StepType "${stepType}" not yet implemented`)
          return acc
        }

        return [...acc, commandCreator]
      }, [])

    const timeline = StepGeneration.commandCreatorsTimeline(commandCreators)(initialRobotState)

    return timeline
  }
)

export const lastValidRobotState: Selector<StepGeneration.RobotState> = createSelector(
  robotStateTimeline,
  getInitialRobotState,
  (timeline, initialRobotState) => {
    const lastTimelineFrame = last(timeline.timeline)
    return (lastTimelineFrame && lastTimelineFrame.robotState) || initialRobotState
  }
)
