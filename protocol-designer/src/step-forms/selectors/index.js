// @flow
import assert from 'assert'
import mapValues from 'lodash/mapValues'
import {createSelector} from 'reselect'
import {INITIAL_DECK_SETUP_STEP_ID} from '../../constants'
import type {InitialDeckSetup} from '../types'
import type {RootState} from '../reducers'
import type {BaseState, Selector} from '../../types'
// TODO: Ian 2018-12-13 make selectors

const rootSelector = (state: BaseState): RootState => state.stepForms

// TODO: Ian 2018-12-14 type properly
export const getLabwareInvariantProperties: Selector<*> = createSelector(
  rootSelector,
  (state) => state.labwareInvariantProperties
)

// TODO: Ian 2018-12-14 type properly
export const getPipetteInvariantProperties: Selector<*> = createSelector(
  rootSelector,
  (state) => state.pipetteInvariantProperties
)

// TODO: Ian 2018-12-14 type properly
export const getInitialDeckSetup: Selector<InitialDeckSetup> = createSelector(
  rootSelector,
  getLabwareInvariantProperties,
  getPipetteInvariantProperties,
  (state, labwareInvariantProperties, pipetteInvariantProperties) => {
    const initialSetupStep = state.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
    assert(
      initialSetupStep && initialSetupStep.stepType === 'manualIntervention',
      'expected initial deck setup step to be "manualIntervention" step')
    const labwareLocations = (initialSetupStep && initialSetupStep.labwareLocationUpdate) || {}
    const pipetteLocations = (initialSetupStep && initialSetupStep.pipetteLocationUpdate) || {}
    return {
      labware: mapValues(labwareLocations, (slot, labwareId) => {
        return {slot, ...labwareInvariantProperties[labwareId]}
      }),
      pipettes: mapValues(pipetteLocations, (mount, pipetteId) => {
        return {mount, ...pipetteInvariantProperties[pipetteId]}
      }),
    }
  }
)
