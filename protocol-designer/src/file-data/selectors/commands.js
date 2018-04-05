// @flow
import {createSelector} from 'reselect'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import {computeWellAccess} from '@opentrons/labware-definitions'
import type {BaseState, Selector} from '../../types'
import * as StepGeneration from '../../step-generation'
import {selectors as steplistSelectors} from '../../steplist/reducers'
import {equippedPipettes} from './pipettes'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import {getAllWellsForLabware} from '../../constants'
import type {IngredInstance, WellContents, AllWellContents} from '../../labware-ingred/types'
import type {ProcessedFormData} from '../../steplist/types'

const all96Tips = reduce( // TODO Ian 2018-04-05 mapValues
  StepGeneration.tiprackWellNamesFlat,
  (acc: {[string]: boolean}, wellName: string) => ({...acc, [wellName]: true}),
  {}
)

type LiquidState = $PropertyType<StepGeneration.RobotState, 'liquidState'>
type LabwareLiquidState = $PropertyType<LiquidState, 'labware'>
type SingleLabwareLiquidState = {[well: string]: StepGeneration.LocationLiquidState}

/** getLabwareLiquidState reshapes data from labwareIngreds.ingredLocations reducer
  * to match RobotState.liquidState.labware's shape
  */
export const getLabwareLiquidState: Selector<LabwareLiquidState> = createSelector(
  labwareIngredSelectors.getLabware,
  labwareIngredSelectors.getIngredientLocations,
  (labware, ingredLocs) => {
    const allLabwareIds = Object.keys(labware)

    type WellVolume = {volume: number}

    function getAllIngredsForLabware (labwareId: string) {
      return reduce(ingredLocs, (ingredAcc: {[wellName: string]: WellVolume}, ingredGroupData: IngredInstance, ingredGroupId: string) => {
        return {
          ...ingredAcc,
          ...reduce(ingredGroupData[labwareId], (wellAcc, wellData: WellVolume, wellName: string) => ({
            ...wellAcc,
            [wellName]: {
              ...ingredAcc[wellName],
              [ingredGroupId]: wellData
            }
          }), {})
        }
      }, {})
    }
    return allLabwareIds.reduce((acc, labwareId) => ({
      ...acc,
      [labwareId]: getAllIngredsForLabware(labwareId)
    }), {})
  }
)

export const getInitialRobotState: BaseState => StepGeneration.RobotState = createSelector(
  equippedPipettes,
  labwareIngredSelectors.getLabware,
  getLabwareLiquidState,
  (pipettes, labware, labwareLiquidState) => {
    type TipState = $PropertyType<StepGeneration.RobotState, 'tipState'>
    type TiprackTipState = $PropertyType<TipState, 'tipracks'>

    const tipracks: TiprackTipState = reduce(
      labware,
      (acc: TiprackTipState, labwareData: StepGeneration.LabwareData, labwareId: string) => {
        if (labwareData.type.startsWith('tiprack')) {
          return {
            ...acc,
            [labwareId]: all96Tips
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

type RobotStateTimelineAcc = {
  formErrors: {[string]: string},
  timeline: Array<{|
    commands: Array<StepGeneration.Command>,
    robotState: StepGeneration.RobotState
  |}>,
  robotState: StepGeneration.RobotState
}

export const robotStateTimeline: BaseState => Array<$Call<StepGeneration.CommandCreator, *>> = createSelector(
  steplistSelectors.validatedForms,
  steplistSelectors.orderedSteps,
  getInitialRobotState,
  (forms, orderedSteps, initialRobotState) => {
    const result = orderedSteps.reduce((acc: RobotStateTimelineAcc, stepId) => {
      if (!isEmpty(acc.formErrors)) {
        // stop reducing if there are errors
        return acc
      }
      const form = forms[stepId]

      if (stepId === 0) {
        // first stepId is initial deck setup.
        return {
          ...acc,
          timeline: [
            ...acc.timeline,
            {
              commands: [],
              robotState: initialRobotState
            }
          ]
        }
      }

      if (!form.validatedForm) {
        return {
          ...acc,
          formErrors: form.errors
        }
      }

      if (form.validatedForm.stepType === 'consolidate') {
        const nextCommandsAndState = StepGeneration.consolidate(form.validatedForm)(acc.robotState)
        return {
          ...acc,
          timeline: [...acc.timeline, nextCommandsAndState],
          robotState: nextCommandsAndState.robotState
        }
      }

      if (form.validatedForm.stepType === 'transfer') {
        const nextCommandsAndState = StepGeneration.transfer(form.validatedForm)(acc.robotState)
        return {
          ...acc,
          timeline: [...acc.timeline, nextCommandsAndState],
          robotState: nextCommandsAndState.robotState
        }
      }

      // TODO don't ignore everything that's not consolidate/transfer
      return {
        ...acc,
        formErrors: {...acc.formErrors, 'STEP NOT IMPLEMENTED': form.validatedForm.stepType}
      }
    }, {formErrors: {}, timeline: [], robotState: initialRobotState})
    // TODO Ian 2018-03-01 pass along name and description of steps for command annotations in file

    if (!isEmpty(result.formErrors)) {
      // TODO 2018-03-01 remove later
      console.warn('Got form errors while constructing timeline', result)
    }

    return result.timeline
  }
)

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
    groupId: ingredGroupIdsWithContent[0] || null // TODO Ian 2018-03-23 show 'gray' when there are multiple group ids.
  }
}

function _wellContentsForLabware (
  labwareLiquids: SingleLabwareLiquidState,
  labwareId: string,
  labwareType: string,
  selectedWells: Array<string>
): AllWellContents {
  const allWellsForContainer = getAllWellsForLabware(labwareType)

  return reduce(
    allWellsForContainer,
    (wellAcc, well: string): {[well: string]: WellContents} => ({
      ...wellAcc,
      [well]: {
        ..._wellContentsForWell(labwareLiquids[well], well),
        // "mix in" selected state
        selected: selectedWells.includes(well)
      }
    }),
    {}
  )
}

function _wellsForPipette (pipetteChannels: 1 | 8, labwareType: string, wells: Array<string>): Array<string> {
  // `wells` is all the wells that pipette's channel 1 interacts with.
  if (pipetteChannels === 8) {
    return wells.reduce((acc, well) => {
      const setOfWellsForMulti = computeWellAccess(labwareType, well)

      return setOfWellsForMulti
        ? [...acc, ...setOfWellsForMulti]
        : acc // setOfWellsForMulti is null
    }, [])
  }
  // single-channel
  return wells
}

function _getSelectedWellsForStep (
  form: ProcessedFormData,
  labwareId: string,
  robotState: StepGeneration.RobotState
): Array<string> {
  if (form.stepType === 'pause') {
    return []
  }

  const pipetteId = form.pipette
  // TODO Ian 2018-04-02 use robotState selectors here
  const pipetteChannels = robotState.instruments[pipetteId].channels
  const labwareType = robotState.labware[labwareId].type

  const getWells = (wells: Array<string>) => _wellsForPipette(pipetteChannels, labwareType, wells)

  let wells = []

  // If we're moving liquids within a single labware,
  // both the source and dest wells together need to be selected.
  if (form.stepType === 'transfer') {
    if (form.sourceLabware === labwareId) {
      wells.push(...getWells(form.sourceWells))
    }
    if (form.destLabware === labwareId) {
      wells.push(...getWells(form.destWells))
    }
  }
  if (form.stepType === 'consolidate') {
    if (form.sourceLabware === labwareId) {
      wells.push(...getWells(form.sourceWells))
    }
    if (form.destLabware === labwareId) {
      wells.push(...getWells([form.destWell]))
    }
  }
  // TODO Ian 2018-03-23 once distribute is supported
  // if (form.stepType === 'distribute') {
  //   ...
  // }
  return wells
}

export const allWellContentsForSteps: Selector<Array<{[labwareId: string]: AllWellContents}>> = createSelector(
  robotStateTimeline,
  steplistSelectors.validatedForms,
  steplistSelectors.hoveredStepId,
  (_robotStateTimeline, _forms, _hoveredStepId) => {
    const liquidStateTimeline = _robotStateTimeline.map(t => t.robotState.liquidState.labware)
    return liquidStateTimeline.map(
      (liquidState, timelineIdx) => mapValues(
        liquidState,
        (labwareLiquids: SingleLabwareLiquidState, labwareId: string) => {
          const robotState = _robotStateTimeline[timelineIdx].robotState
          const labwareType = robotState.labware[labwareId].type
          const formIdx = timelineIdx + 1 // add 1 to make up for initial deck setup action

          const form = _forms[formIdx] && _forms[formIdx].validatedForm
          const selectedWells = (form && _hoveredStepId === formIdx)
            // only show selected wells when user is **hovering** over the step
            ? _getSelectedWellsForStep(form, labwareId, robotState)
            : []

          return _wellContentsForLabware(
            labwareLiquids,
            labwareId,
            labwareType,
            selectedWells
          )
        }
      )
    )
  }
)
